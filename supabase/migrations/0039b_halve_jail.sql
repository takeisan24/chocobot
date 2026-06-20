-- ============================================================
-- 0039b_halve_jail.sql — Giảm nửa thời gian giam còn lại (khi dùng bảo hiểm bh_duong_pho)
-- ============================================================
CREATE OR REPLACE FUNCTION halve_jail(p_user_id TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_until TIMESTAMPTZ;
BEGIN
    SELECT jailed_until INTO v_until FROM users WHERE user_id=p_user_id FOR UPDATE;
    IF v_until IS NULL OR v_until <= now() THEN RETURN false; END IF;
    UPDATE users SET jailed_until = now() + (v_until - now())/2 WHERE user_id=p_user_id;
    RETURN true;
END $$;
