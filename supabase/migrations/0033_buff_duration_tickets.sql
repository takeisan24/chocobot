-- ============================================================
-- 0033_buff_duration_tickets.sql — Buff theo thời lượng item + vé tăng thu nhập
-- ============================================================
alter table items add column if not exists effect_duration_hours int not null default 1;

create or replace function consume_item(p_user_id text, p_item_id text)
returns text language plpgsql as $$
declare v_type text; v_val int; v_dur int; v_qty int; v_cur int;
begin
    select effect_type, effect_value, effect_duration_hours into v_type, v_val, v_dur from items where id = p_item_id;
    if not found then return 'no_item'; end if;
    if v_type is null or v_type = 'none' then return 'not_consumable'; end if;
    if v_dur is null then v_dur := 1; end if;

    select quantity into v_qty from inventory where user_id = p_user_id and item_id = p_item_id;
    if v_qty is null or v_qty < 1 then return 'no_have'; end if;

    update inventory set quantity = quantity - 1 where user_id = p_user_id and item_id = p_item_id;
    delete from inventory where user_id = p_user_id and item_id = p_item_id and quantity <= 0;

    if v_type = 'energy' then
        v_cur := regen_energy(p_user_id);
        update users set
            energy = least(100, v_cur + v_val),
            energy_updated_at = case when v_cur + v_val >= 100 then now() else energy_updated_at end
            where user_id = p_user_id;
    elsif v_type = 'buff' then
        update users set buff_mult = 1 + (v_val::real / 100), buff_expires_at = now() + make_interval(hours => v_dur)
            where user_id = p_user_id;
    end if;

    return 'ok';
end; $$;

insert into items (id, name, price, type, effect_type, effect_value, effect_duration_hours) values
    ('ve_vip',      'Vé VIP',       20000, 'consumable', 'buff', 50,  12),
    ('ve_dai_gia',  'Vé Đại Gia',   35000, 'consumable', 'buff', 100, 3)
on conflict (id) do nothing;
