-- ============================================================
-- 0041_closed_loop.sql — v2: vòng khép kín nguyên liệu, nghề nông, tặng đồ, cap box/ngày
-- ============================================================

-- Vật phẩm vòng khép kín (ẩn khỏi shop; chỉ có từ loop/craft)
INSERT INTO items (id,name,description,price,type,effect_type,effect_value,effect_duration_hours,shop_hidden) VALUES
 ('cam_heo','Cám Heo','Thức ăn cho heo (nhận khi thu hoạch cây). Cho heo ăn lần 2 đỡ tốn tiền.',200,'misc','none',0,1,true),
 ('phan_bon','Phân Bón','Phân bón hữu cơ (nhận khi nuôi heo). Bón cây miễn phí.',200,'misc','none',0,1,true),
 ('do_trom','Đồ Nghề Trộm','Bộ đồ nghề chế từ gỗ & sắt — đi trộm khỏi tốn tiền mua đồ.',400,'tool','none',0,1,true)
ON CONFLICT (id) DO NOTHING;

-- Nghề nông (mở khoá ở Lv.5, lương khá, rủi ro thấp)
INSERT INTO jobs (id,name,required_level,min_wage,max_wage,risk_rate,required_item_id) VALUES
 ('nong_dan','Nông dân nông trại',5,320,850,0.10,NULL)
ON CONFLICT (id) DO NOTHING;

-- Lấy 1 vật phẩm khỏi kho (atomic). Trả TRUE nếu đủ.
CREATE OR REPLACE FUNCTION take_item(p_user_id TEXT, p_item_id TEXT, p_qty INT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_qty INT;
BEGIN
    SELECT quantity INTO v_qty FROM inventory WHERE user_id=p_user_id AND item_id=p_item_id FOR UPDATE;
    IF v_qty IS NULL OR v_qty < p_qty THEN RETURN false; END IF;
    UPDATE inventory SET quantity=quantity-p_qty WHERE user_id=p_user_id AND item_id=p_item_id;
    DELETE FROM inventory WHERE user_id=p_user_id AND item_id=p_item_id AND quantity<=0;
    RETURN true;
END $$;

-- Chuyển vật phẩm giữa 2 người (atomic). Trả TRUE nếu đủ.
CREATE OR REPLACE FUNCTION transfer_item(p_from TEXT, p_to TEXT, p_item_id TEXT, p_qty INT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_qty INT;
BEGIN
    SELECT quantity INTO v_qty FROM inventory WHERE user_id=p_from AND item_id=p_item_id FOR UPDATE;
    IF v_qty IS NULL OR v_qty < p_qty THEN RETURN false; END IF;
    UPDATE inventory SET quantity=quantity-p_qty WHERE user_id=p_from AND item_id=p_item_id;
    DELETE FROM inventory WHERE user_id=p_from AND item_id=p_item_id AND quantity<=0;
    INSERT INTO inventory(user_id,item_id,quantity) VALUES (p_to,p_item_id,p_qty)
        ON CONFLICT (user_id,item_id) DO UPDATE SET quantity=inventory.quantity+EXCLUDED.quantity;
    RETURN true;
END $$;

-- Đếm lượt theo ngày (pigbox/plantbox...). Trả số đã dùng (>=1), hoặc -1 nếu vượt cap.
CREATE TABLE IF NOT EXISTS daily_counters (
    user_id TEXT NOT NULL,
    key     TEXT NOT NULL,
    day     DATE NOT NULL,
    count   INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, key)
);
CREATE OR REPLACE FUNCTION claim_daily_counter(p_user_id TEXT, p_key TEXT, p_max INT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_count INT;
BEGIN
    INSERT INTO daily_counters(user_id,key,day,count) VALUES (p_user_id,p_key,CURRENT_DATE,1)
        ON CONFLICT (user_id,key) DO UPDATE SET
            count = CASE WHEN daily_counters.day = CURRENT_DATE THEN daily_counters.count+1 ELSE 1 END,
            day = CURRENT_DATE
        RETURNING count INTO v_count;
    IF v_count > p_max THEN
        UPDATE daily_counters SET count=p_max WHERE user_id=p_user_id AND key=p_key;
        RETURN -1;
    END IF;
    RETURN v_count;
END $$;
