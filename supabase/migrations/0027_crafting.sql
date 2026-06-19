-- ============================================================
-- 0027_crafting.sql — Hệ thống chế tạo (craft)
-- Nguyên liệu (rơi từ /mine /chop) -> tinh chế -> đồ giá trị để bán.
-- ============================================================

-- Nguyên liệu thô + đồ chế (thêm vào shop/items; bán được 50% như đồ thường)
insert into items (id, name, price, type, effect_type, effect_value) values
    ('go',        'Gỗ',               60,   'material', 'none', 0),
    ('quang_sat', 'Quặng Sắt',        100,  'material', 'none', 0),
    ('da',        'Đá',               40,   'material', 'none', 0),
    ('tam_go',    'Tấm Gỗ',           250,  'misc',     'none', 0),
    ('thoi_sat',  'Thỏi Sắt',         400,  'misc',     'none', 0),
    ('noi_that',  'Bộ Nội Thất Gỗ',   5000, 'misc',     'none', 0),
    ('trang_suc', 'Trang Sức Đá Quý', 6000, 'misc',     'none', 0)
on conflict (id) do nothing;

-- Chế tạo nguyên tử: kiểm tra đủ nguyên liệu + tiền -> trừ -> tạo thành phẩm.
-- p_mats: jsonb {"go":"3","quang_sat":"1"}
create or replace function craft_item(p_user text, p_mats jsonb, p_result text, p_qty int, p_cost bigint)
returns jsonb language plpgsql as $$
declare k text; v text; v_have int; v_wallet bigint;
begin
    insert into users(user_id) values(p_user) on conflict(user_id) do nothing;
    select wallet into v_wallet from users where user_id = p_user;
    v_wallet := coalesce(v_wallet, 0);
    if v_wallet < p_cost then return jsonb_build_object('status','poor_money'); end if;

    -- kiểm tra đủ nguyên liệu
    for k, v in select key, value from jsonb_each_text(p_mats) loop
        select coalesce(quantity,0) into v_have from inventory where user_id = p_user and item_id = k;
        if coalesce(v_have,0) < v::int then return jsonb_build_object('status','poor_mat','missing', k); end if;
    end loop;

    -- trừ nguyên liệu
    for k, v in select key, value from jsonb_each_text(p_mats) loop
        update inventory set quantity = quantity - v::int where user_id = p_user and item_id = k;
    end loop;
    delete from inventory where user_id = p_user and quantity <= 0;

    if p_cost > 0 then update users set wallet = wallet - p_cost where user_id = p_user; end if;

    -- tạo thành phẩm
    update inventory set quantity = quantity + p_qty where user_id = p_user and item_id = p_result;
    if not found then
        insert into inventory(id, user_id, item_id, quantity) values (gen_random_uuid(), p_user, p_result, p_qty);
    end if;

    return jsonb_build_object('status','ok');
end; $$;
