-- ============================================================
-- 0040_plants.sql — Hệ trồng cây
-- mua giống -> tưới 3 lần (mỗi lần cách 3h; bón phân/tưới hộ +1 ngay) -> trưởng thành
--   -> thu hoạch (sau 1h) -> nhận trái/hoa (item). Chết nếu bỏ tưới 5h.
--   Trộm được nếu chủ không thu sau 1h30; sâu bọ (mất trắng) sau 4h.
-- ============================================================

CREATE TABLE IF NOT EXISTS plants (
    user_id        TEXT PRIMARY KEY,
    type           TEXT,
    tier           INT,
    is_flower      BOOLEAN NOT NULL DEFAULT false,
    water          INT NOT NULL DEFAULT 0,
    stage          TEXT NOT NULL DEFAULT 'growing',  -- growing -> mature -> dead
    helpers        TEXT[] NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_water_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    mature_at      TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS plant_steal_fails INT NOT NULL DEFAULT 0;

-- Đầu ra: trái cây (consumable, /eat hồi năng lượng) + hoa (quà, chỉ /sell). Ẩn khỏi shop.
INSERT INTO items (id,name,description,price,type,effect_type,effect_value,effect_duration_hours,shop_hidden) VALUES
 ('trai_1500','Trái Cây Loại Thường','Trái cây vườn nhà. /eat hồi năng lượng hoặc /sell.',3000,'consumable','energy',30,1,true),
 ('trai_2000','Trái Cây Loại Khá','Trái cây tươi ngon. /eat hồi năng lượng hoặc /sell.',4000,'consumable','energy',40,1,true),
 ('trai_2500','Trái Cây Loại Ngon','Trái cây mọng nước. /eat hồi năng lượng hoặc /sell.',5000,'consumable','energy',60,1,true),
 ('trai_3000','Trái Cây Loại Tuyển','Trái cây tuyển chọn. /eat hồi năng lượng hoặc /sell.',6000,'consumable','energy',80,1,true),
 ('trai_3500','Trái Cây Hảo Hạng','Trái cây hảo hạng. /eat hồi đầy năng lượng hoặc /sell.',7000,'consumable','energy',100,1,true),
 ('hoa_1500','Hoa Loại Thường','Một đoá hoa xinh. Có thể /sell.',3000,'misc','none',0,1,true),
 ('hoa_2000','Hoa Loại Khá','Bó hoa tươi tắn. Có thể /sell.',4000,'misc','none',0,1,true),
 ('hoa_2500','Hoa Loại Đẹp','Bó hoa rực rỡ. Có thể /sell.',5000,'misc','none',0,1,true),
 ('hoa_3000','Hoa Loại Quý','Bó hoa quý phái. Có thể /sell.',6000,'misc','none',0,1,true),
 ('hoa_3500','Hoa Hảo Hạng','Bó hoa thượng hạng. Có thể /sell.',7000,'misc','none',0,1,true)
ON CONFLICT (id) DO NOTHING;

-- RPC: mua giống (giống ngẫu nhiên do JS quyết định, truyền vào)
CREATE OR REPLACE FUNCTION plant_buy(p_user_id TEXT, p_cost BIGINT, p_type TEXT, p_tier INT, p_flower BOOLEAN) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_wallet BIGINT;
BEGIN
    IF EXISTS(SELECT 1 FROM plants WHERE user_id=p_user_id) THEN RETURN 'has_plant'; END IF;
    SELECT wallet INTO v_wallet FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN 'no_user'; END IF;
    IF v_wallet < p_cost THEN RETURN 'insufficient'; END IF;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    INSERT INTO plants(user_id, type, tier, is_flower, water, stage) VALUES (p_user_id, p_type, p_tier, p_flower, 0, 'growing');
    RETURN 'ok';
END $$;

-- RPC: tưới nước (gate 3h). p_interval_secs = 10800. Trả jsonb.
CREATE OR REPLACE FUNCTION plant_water(p_user_id TEXT, p_interval_secs INT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_stage TEXT; v_water INT; v_age DOUBLE PRECISION;
BEGIN
    SELECT stage, water, EXTRACT(EPOCH FROM (now()-last_water_at)) INTO v_stage, v_water, v_age FROM plants WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_plant'); END IF;
    IF v_stage='dead' THEN RETURN jsonb_build_object('result','dead'); END IF;
    IF v_stage<>'growing' THEN RETURN jsonb_build_object('result','done'); END IF;
    IF v_age < p_interval_secs THEN RETURN jsonb_build_object('result','too_soon','wait', CEIL(p_interval_secs - v_age)); END IF;
    v_water := v_water + 1;
    IF v_water >= 3 THEN
        UPDATE plants SET water=v_water, last_water_at=now(), stage='mature', mature_at=now() WHERE user_id=p_user_id;
        RETURN jsonb_build_object('result','mature');
    END IF;
    UPDATE plants SET water=v_water, last_water_at=now() WHERE user_id=p_user_id;
    RETURN jsonb_build_object('result','ok','water',v_water);
END $$;

-- RPC: bón phân (+1 nước ngay, tốn tiền)
CREATE OR REPLACE FUNCTION plant_fertilize(p_user_id TEXT, p_cost BIGINT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_stage TEXT; v_water INT; v_wallet BIGINT;
BEGIN
    SELECT stage, water INTO v_stage, v_water FROM plants WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_plant'); END IF;
    IF v_stage<>'growing' THEN RETURN jsonb_build_object('result','not_growing'); END IF;
    SELECT wallet INTO v_wallet FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF v_wallet < p_cost THEN RETURN jsonb_build_object('result','insufficient'); END IF;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    v_water := v_water + 1;
    IF v_water >= 3 THEN
        UPDATE plants SET water=v_water, last_water_at=now(), stage='mature', mature_at=now() WHERE user_id=p_user_id;
        RETURN jsonb_build_object('result','mature');
    END IF;
    UPDATE plants SET water=v_water, last_water_at=now() WHERE user_id=p_user_id;
    RETURN jsonb_build_object('result','ok','water',v_water);
END $$;

-- RPC: tưới hộ (mỗi người 1 lần/cây, không gate thời gian)
CREATE OR REPLACE FUNCTION plant_water_help(p_helper TEXT, p_owner TEXT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_stage TEXT; v_water INT; v_helpers TEXT[];
BEGIN
    SELECT stage, water, helpers INTO v_stage, v_water, v_helpers FROM plants WHERE user_id=p_owner FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_plant'); END IF;
    IF v_stage<>'growing' THEN RETURN jsonb_build_object('result','not_growing'); END IF;
    IF p_helper = ANY(v_helpers) THEN RETURN jsonb_build_object('result','already'); END IF;
    v_water := v_water + 1;
    IF v_water >= 3 THEN
        UPDATE plants SET water=v_water, last_water_at=now(), helpers=array_append(helpers,p_helper), stage='mature', mature_at=now() WHERE user_id=p_owner;
        RETURN jsonb_build_object('result','mature');
    END IF;
    UPDATE plants SET water=v_water, last_water_at=now(), helpers=array_append(helpers,p_helper) WHERE user_id=p_owner;
    RETURN jsonb_build_object('result','ok','water',v_water);
END $$;

-- RPC: claim cây trưởng thành để THU HOẠCH/TRỘM. Tuổi (kể từ mature_at) phải trong [min,max].
--   < min: too_soon · > max: pest (mất trắng, xoá luôn) · ok: trả tier+is_flower
CREATE OR REPLACE FUNCTION plant_claim(p_user_id TEXT, p_min_age INT, p_max_age INT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE v_stage TEXT; v_tier INT; v_flower BOOLEAN; v_age DOUBLE PRECISION;
BEGIN
    SELECT stage, tier, is_flower, EXTRACT(EPOCH FROM (now()-mature_at)) INTO v_stage, v_tier, v_flower, v_age FROM plants WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_plant'); END IF;
    IF v_stage<>'mature' THEN RETURN jsonb_build_object('result','not_ready'); END IF;
    IF v_age < p_min_age THEN RETURN jsonb_build_object('result','too_soon','wait', CEIL(p_min_age - v_age)); END IF;
    IF v_age > p_max_age THEN
        DELETE FROM plants WHERE user_id=p_user_id;
        RETURN jsonb_build_object('result','pest');
    END IF;
    DELETE FROM plants WHERE user_id=p_user_id;
    RETURN jsonb_build_object('result','ok','tier',v_tier,'is_flower',v_flower);
END $$;

-- RPC: hồi sinh cây chết
CREATE OR REPLACE FUNCTION plant_revive(p_user_id TEXT, p_cost BIGINT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_stage TEXT; v_wallet BIGINT;
BEGIN
    SELECT stage INTO v_stage FROM plants WHERE user_id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RETURN 'no_plant'; END IF;
    IF v_stage<>'dead' THEN RETURN 'not_dead'; END IF;
    SELECT wallet INTO v_wallet FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF v_wallet < p_cost THEN RETURN 'insufficient'; END IF;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    UPDATE plants SET stage='growing', water=0, last_water_at=now(), mature_at=NULL WHERE user_id=p_user_id;
    RETURN 'ok';
END $$;

-- RPC: ghi nhận trộm cây thất bại; chạm 3 -> reset (JS kích hoạt giam)
CREATE OR REPLACE FUNCTION plant_steal_fail(p_user_id TEXT) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    UPDATE users SET plant_steal_fails = plant_steal_fails + 1 WHERE user_id=p_user_id RETURNING plant_steal_fails INTO v_n;
    IF v_n IS NULL THEN RETURN 0; END IF;
    IF v_n >= 3 THEN UPDATE users SET plant_steal_fails=0 WHERE user_id=p_user_id; END IF;
    RETURN v_n;
END $$;
