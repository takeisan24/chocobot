-- ============================================================
-- 0039_pigs.sql — Hệ nuôi heo
-- Chu trình: mua -> cho ăn(cám tặng) -> tắm -> ngủ -> cho ăn 2(500đ, trưởng thành)
--           -> bán (ra "Thịt Heo" theo tier). Bệnh nếu bỏ bê 4h. Trộm sau chủ 15'.
-- Đầu ra = item consumable ẩn khỏi shop (/eat hồi năng lượng-buff, /sell lấy tiền).
-- ============================================================

CREATE TABLE IF NOT EXISTS pigs (
    user_id        TEXT PRIMARY KEY,
    type           TEXT,                          -- tên giống heo (đặt khi trưởng thành, mỹ thuật)
    tier           INT,                           -- giá trị tier (2000..50000), set khi trưởng thành
    stage          TEXT NOT NULL DEFAULT 'baby',  -- baby -> fed -> bathed -> slept -> mature
    cam            INT  NOT NULL DEFAULT 1,        -- cám tặng còn lại
    sick           BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_action_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS pig_steal_fails INT NOT NULL DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS shop_hidden BOOLEAN NOT NULL DEFAULT false;

-- Đầu ra nuôi heo: thịt heo theo tier (ẩn khỏi shop; /sell trả 50% giá => đúng giá trị spec)
INSERT INTO items (id,name,description,price,type,effect_type,effect_value,effect_duration_hours,shop_hidden) VALUES
 ('thit_heo_2000','Thịt Heo Loại Thường','Thịt heo nuôi nhà. /eat hồi năng lượng hoặc /sell lấy tiền.',4000,'consumable','energy',40,1,true),
 ('thit_heo_2500','Thịt Heo Loại Khá','Thịt heo chắc thịt. /eat hồi năng lượng hoặc /sell.',5000,'consumable','energy',60,1,true),
 ('thit_heo_3000','Thịt Heo Loại Ngon','Thịt heo thơm ngon. /eat hồi năng lượng hoặc /sell.',6000,'consumable','energy',80,1,true),
 ('thit_heo_3500','Thịt Heo Loại Tuyển','Thịt heo tuyển chọn. /eat hồi đầy năng lượng hoặc /sell.',7000,'consumable','energy',100,1,true),
 ('thit_heo_4000','Thịt Heo Bạch Tạng','Thịt heo bạch tạng quý hiếm. /eat nhận buff thu nhập hoặc /sell.',8000,'consumable','buff',20,2,true),
 ('thit_heo_holo','Thịt Heo Hologram','Thịt heo huyền thoại lấp lánh! /eat buff lớn hoặc /sell giá khủng.',100000,'consumable','buff',100,6,true)
ON CONFLICT (id) DO NOTHING;

-- RPC: mua heo (atomic trừ tiền + tạo heo + tặng 1 cám)
CREATE OR REPLACE FUNCTION pig_buy(p_user_id TEXT, p_cost BIGINT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_wallet BIGINT;
BEGIN
    IF EXISTS(SELECT 1 FROM pigs WHERE user_id=p_user_id) THEN RETURN 'has_pig'; END IF;
    SELECT wallet INTO v_wallet FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN 'no_user'; END IF;
    IF v_wallet < p_cost THEN RETURN 'insufficient'; END IF;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    INSERT INTO pigs(user_id, stage, cam) VALUES (p_user_id, 'baby', 1);
    RETURN 'ok';
END $$;

-- RPC: cho ăn lần 2 -> trưởng thành (trừ tiền + random tier giá trị)
CREATE OR REPLACE FUNCTION pig_mature(p_user_id TEXT, p_cost BIGINT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_wallet BIGINT; v_stage TEXT; v_r DOUBLE PRECISION; v_tier INT;
BEGIN
    SELECT stage INTO v_stage FROM pigs WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_pig'); END IF;
    IF v_stage <> 'slept' THEN RETURN jsonb_build_object('result','bad_stage'); END IF;
    SELECT wallet INTO v_wallet FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF v_wallet < p_cost THEN RETURN jsonb_build_object('result','insufficient'); END IF;
    v_r := random();
    v_tier := CASE WHEN v_r<0.35 THEN 2000 WHEN v_r<0.63 THEN 2500 WHEN v_r<0.83 THEN 3000
                   WHEN v_r<0.95 THEN 3500 WHEN v_r<0.99 THEN 4000 ELSE 50000 END;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    UPDATE pigs SET stage='mature', tier=v_tier, last_action_at=now() WHERE user_id=p_user_id;
    RETURN jsonb_build_object('result','ok','tier',v_tier);
END $$;

-- RPC: chữa bệnh (trừ tiền + hết bệnh)
CREATE OR REPLACE FUNCTION pig_heal(p_user_id TEXT, p_cost BIGINT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_wallet BIGINT; v_sick BOOLEAN;
BEGIN
    SELECT sick INTO v_sick FROM pigs WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN 'no_pig'; END IF;
    IF NOT v_sick THEN RETURN 'not_sick'; END IF;
    SELECT wallet INTO v_wallet FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF v_wallet < p_cost THEN RETURN 'insufficient'; END IF;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    UPDATE pigs SET sick=false, last_action_at=now() WHERE user_id=p_user_id;
    RETURN 'ok';
END $$;

-- RPC: claim heo trưởng thành để BÁN/TRỘM (atomic xoá, trả tier). p_min_age_secs: tuổi tối thiểu kể từ khi trưởng thành.
CREATE OR REPLACE FUNCTION pig_claim_sale(p_user_id TEXT, p_min_age_secs INT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_stage TEXT; v_tier INT; v_age DOUBLE PRECISION;
BEGIN
    SELECT stage, tier, EXTRACT(EPOCH FROM (now()-last_action_at)) INTO v_stage, v_tier, v_age
        FROM pigs WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_pig'); END IF;
    IF v_stage <> 'mature' THEN RETURN jsonb_build_object('result','not_ready'); END IF;
    IF v_age < p_min_age_secs THEN RETURN jsonb_build_object('result','too_soon','wait', CEIL(p_min_age_secs - v_age)); END IF;
    DELETE FROM pigs WHERE user_id=p_user_id;
    RETURN jsonb_build_object('result','ok','tier',v_tier);
END $$;

-- RPC: ghi nhận 1 lần trộm heo thất bại; trả về số lần. Chạm 3 -> reset 0 (để JS kích hoạt giam).
CREATE OR REPLACE FUNCTION pig_steal_fail(p_user_id TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    UPDATE users SET pig_steal_fails = pig_steal_fails + 1 WHERE user_id=p_user_id RETURNING pig_steal_fails INTO v_n;
    IF v_n IS NULL THEN RETURN 0; END IF;
    IF v_n >= 3 THEN UPDATE users SET pig_steal_fails=0 WHERE user_id=p_user_id; END IF;
    RETURN v_n;
END $$;
