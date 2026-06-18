-- ============================================================
-- 0016_durability.sql — Hệ thống Độ bền & Sửa chữa công cụ
-- ============================================================
alter table inventory add column if not exists durability int not null default 100;

INSERT INTO items (id, name, description, price, type, effect_type, effect_value) VALUES
('can_cau', 'Cần câu cá', 'Dùng để câu cá kiếm tiền (/fish). Độ bền 100.', 1000, 'tool', 'none', 0),
('riu_sat', 'Rìu sắt', 'Dùng để chặt gỗ kiếm tiền (/chop). Độ bền 100.', 1500, 'tool', 'none', 0),
('cuoc_sat', 'Cuốc sắt', 'Dùng để đào mỏ kiếm tiền (/mine). Độ bền 100.', 1500, 'tool', 'none', 0)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
price = EXCLUDED.price,
type = EXCLUDED.type;

create or replace function use_tool(p_user_id text, p_item_id text)
returns jsonb language plpgsql as $$
declare v_qty int; v_dur int; v_broken boolean := false;
begin
    select quantity, durability into v_qty, v_dur from inventory where user_id = p_user_id and item_id = p_item_id;
    if v_qty is null or v_qty < 1 then
        return jsonb_build_object('status', 'no_tool');
    end if;

    v_dur := v_dur - 2;
    if v_dur <= 0 then
        v_broken := true;
        update inventory set quantity = quantity - 1, durability = 100 where user_id = p_user_id and item_id = p_item_id;
        delete from inventory where user_id = p_user_id and item_id = p_item_id and quantity <= 0;
    else
        update inventory set durability = v_dur where user_id = p_user_id and item_id = p_item_id;
    end if;

    return jsonb_build_object('status', 'ok', 'durability', v_dur, 'broken', v_broken);
end; $$;

create or replace function repair_tool(p_user_id text, p_item_id text, p_cost int)
returns text language plpgsql as $$
declare v_qty int; v_dur int; v_wallet bigint;
begin
    select quantity, durability into v_qty, v_dur from inventory where user_id = p_user_id and item_id = p_item_id;
    if v_qty is null or v_qty < 1 then return 'no_tool'; end if;
    if v_dur >= 100 then return 'already_repaired'; end if;

    select wallet into v_wallet from users where user_id = p_user_id;
    if v_wallet is null or v_wallet < p_cost then return 'insufficient_funds'; end if;

    update users set wallet = wallet - p_cost where user_id = p_user_id;
    update inventory set durability = 100 where user_id = p_user_id and item_id = p_item_id;
    return 'ok';
end; $$;
