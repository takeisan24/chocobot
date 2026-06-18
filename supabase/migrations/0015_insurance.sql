-- ============================================================
-- 0015_insurance.sql — Hệ thống Bảo hiểm (Lao động & Đường phố)
-- ============================================================
INSERT INTO items (id, name, description, price, type, effect_type, effect_value) VALUES
('bh_lao_dong', 'Bảo hiểm Lao động', 'Giảm 80% tổn thất tiền khi gặp tai nạn lao động (/work thất bại). Tiêu hao khi kích hoạt.', 1000, 'tool', 'none', 0),
('bh_duong_pho', 'Bảo hiểm Đường phố', 'Giảm 50% tiền phạt khi bị công an bắt hoặc đi cướp thất bại. Tiêu hao khi kích hoạt.', 2000, 'tool', 'none', 0)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
price = EXCLUDED.price,
type = EXCLUDED.type;

create or replace function use_insurance(p_user_id text, p_item_id text)
returns boolean language plpgsql as $$
declare v_qty int;
begin
    select quantity into v_qty from inventory where user_id = p_user_id and item_id = p_item_id;
    if v_qty is null or v_qty < 1 then return false; end if;
    update inventory set quantity = quantity - 1 where user_id = p_user_id and item_id = p_item_id;
    delete from inventory where user_id = p_user_id and item_id = p_item_id and quantity <= 0;
    return true;
end; $$;
