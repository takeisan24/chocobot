-- ============================================================
-- 0042_rebalance_naming.sql
--  (1) Rebalance: giảm tỉ lệ "Heo Hologram" 1% -> 0.5% (chống fat-tail lạm phát)
--  (2) Dọn tên vật phẩm: gỡ tham chiếu IP (Doraemon) + chuẩn hoá Title Case
-- An toàn chạy lại (CREATE OR REPLACE + UPDATE theo id).
-- ============================================================

-- (1) Heo trưởng thành: holo từ v_r>=0.99 (1%) -> v_r>=0.995 (0.5%); tier 4000 nới 4%->4.5%.
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
                   WHEN v_r<0.95 THEN 3500 WHEN v_r<0.995 THEN 4000 ELSE 50000 END;
    UPDATE users SET wallet=wallet-p_cost WHERE user_id=p_user_id;
    UPDATE pigs SET stage='mature', tier=v_tier, last_action_at=now() WHERE user_id=p_user_id;
    RETURN jsonb_build_object('result','ok','tier',v_tier);
END $$;

-- (2) Dọn tên vật phẩm
UPDATE items SET name='Hộp Bút Hoa Anh Đào' WHERE id='hop_but';   -- gỡ "Doraemon" (IP + lệch tông)
UPDATE items SET name='Thuốc Cảm Cúm'        WHERE id='thuoc_cam_cum';
UPDATE items SET name='Cần Câu Cá'           WHERE id='can_cau';
UPDATE items SET name='Rìu Sắt'              WHERE id='riu_sat';
UPDATE items SET name='Cuốc Sắt'             WHERE id='cuoc_sat';
