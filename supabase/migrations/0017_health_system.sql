-- ============================================================
-- 0017_health_system.sql — Hệ thống Y tế & Sức khỏe
-- ============================================================

-- 1. Thêm cột health cho bảng users
alter table users add column if not exists health int not null default 100;

-- 2. Thêm thuốc và hộp y tế vào bảng items
INSERT INTO items (id, name, description, price, type, effect_type, effect_value) VALUES
('thuoc_cam_cum', 'Thuốc cảm cúm', 'Hồi phục 20 điểm sức khỏe khi sử dụng (/eat).', 150, 'consumable', 'health', 20),
('hop_y_te', 'Hộp y tế', 'Hồi phục 50 điểm sức khỏe khi sử dụng (/eat).', 500, 'consumable', 'health', 50)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
price = EXCLUDED.price,
type = EXCLUDED.type,
effect_type = EXCLUDED.effect_type,
effect_value = EXCLUDED.effect_value;

-- 3. Cập nhật hàm consume_item hỗ trợ hồi sức khỏe
create or replace function consume_item(p_user_id text, p_item_id text)
returns text language plpgsql as $$
declare v_type text; v_val int; v_qty int; v_cur int;
begin
    select effect_type, effect_value into v_type, v_val from items where id = p_item_id;
    if not found then return 'no_item'; end if;
    if v_type is null or v_type = 'none' then return 'not_consumable'; end if;

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
        update users set buff_mult = 1 + (v_val::real / 100), buff_expires_at = now() + interval '1 hour'
            where user_id = p_user_id;
    elsif v_type = 'health' then
        update users set health = least(100, health + v_val) where user_id = p_user_id;
    end if;

    return 'ok';
end; $$;

-- 4. Tạo hàm hospital_heal nhập viện điều trị
create or replace function hospital_heal(p_user_id text)
returns jsonb language plpgsql as $$
declare v_wallet bigint; v_fee bigint; v_health int;
begin
    select wallet, health into v_wallet, v_health from users where user_id = p_user_id;
    if v_wallet is null then
        insert into users (user_id) values (p_user_id) on conflict (user_id) do nothing;
        select wallet, health into v_wallet, v_health from users where user_id = p_user_id;
    end if;
    if v_health is null then v_health := 100; end if;
    if v_wallet is null then v_wallet := 0; end if;

    if v_health >= 100 then
        return jsonb_build_object('status', 'already_healthy', 'fee', 0);
    end if;

    v_fee := floor(v_wallet * 0.1);
    if v_fee < 500 then
        v_fee := 500;
    end if;

    if v_wallet < v_fee then
        return jsonb_build_object('status', 'insufficient_funds', 'fee', v_fee);
    end if;

    update users set
        wallet = wallet - v_fee,
        health = 100
        where user_id = p_user_id;

    return jsonb_build_object('status', 'ok', 'fee', v_fee);
end; $$;
