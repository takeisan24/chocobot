-- ============================================================
-- 0018_vehicle_system.sql — Hệ thống Xe cộ & Phương tiện
-- ============================================================

-- 1. Thêm các phương tiện vào bảng items
INSERT INTO items (id, name, description, price, type, effect_type, effect_value) VALUES
('xe_wave', 'Xe Wave', 'Phương tiện đi lại. Giảm tốn năng lượng khi làm việc xuống 8. Độ bền 100.', 3000, 'vehicle', 'none', 0),
('xe_sh', 'Xe SH', 'Phương tiện đi lại cao cấp. Giảm tốn năng lượng khi làm việc xuống 6. Độ bền 100.', 15000, 'vehicle', 'none', 0),
('o_to_vinfast', 'Ô tô VinFast', 'Phương tiện đi lại siêu cấp. Giảm tốn năng lượng khi làm việc xuống 4. Độ bền 100.', 50000, 'vehicle', 'none', 0)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
price = EXCLUDED.price,
type = EXCLUDED.type;

-- 2. Hàm sử dụng phương tiện để di chuyển đi làm
create or replace function use_vehicle(p_user_id text)
returns jsonb language plpgsql as $$
declare
    v_item_id text;
    v_qty int;
    v_dur int;
    v_broken boolean := false;
begin
    select item_id, quantity, durability into v_item_id, v_qty, v_dur
    from inventory
    where user_id = p_user_id and item_id in ('o_to_vinfast', 'xe_sh', 'xe_wave')
    order by case item_id
        when 'o_to_vinfast' then 1
        when 'xe_sh' then 2
        when 'xe_wave' then 3
        else 4
    end asc
    limit 1;

    if v_item_id is null then
        return null;
    end if;

    v_dur := v_dur - 1;
    if v_dur <= 0 then
        v_broken := true;
        update inventory set quantity = quantity - 1, durability = 100 where user_id = p_user_id and item_id = v_item_id;
        delete from inventory where user_id = p_user_id and item_id = v_item_id and quantity <= 0;
    else
        update inventory set durability = v_dur where user_id = p_user_id and item_id = v_item_id;
    end if;

    return jsonb_build_object('status', 'ok', 'vehicle_id', v_item_id, 'durability', v_dur, 'broken', v_broken);
end; $$;
