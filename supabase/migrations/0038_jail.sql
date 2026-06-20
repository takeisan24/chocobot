-- ============================================================
-- 0038_jail.sql — Hệ "giam giữ" dùng chung (trộm heo/cây, cướp /rob...)
-- Khi phạm pháp thất bại mà không đủ tiền nộp phạt -> bị giam, chặn
-- các lệnh kiếm tiền / cờ bạc / đi trộm cho tới khi hết hạn.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS jailed_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jail_reason  TEXT;

-- Atomic: thử nộp phạt, không đủ tiền thì giam.
--   p_fine      : tiền phạt (VNĐ) trừ vào ví nếu đủ
--   p_jail_hours: số giờ giam nếu không đủ tiền
--   p_reason    : lý do (hiển thị ở /status)
-- Trả JSONB:
--   { "result": "fined",  "fine": <n> }                — đã trừ phạt, không giam
--   { "result": "jailed", "until": "<timestamptz>" }   — đã giam
CREATE OR REPLACE FUNCTION jail_or_fine(
    p_user_id    TEXT,
    p_fine       BIGINT,
    p_jail_hours INT,
    p_reason     TEXT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_wallet BIGINT;
    v_until  TIMESTAMPTZ;
BEGIN
    SELECT wallet INTO v_wallet FROM users WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('result', 'error');
    END IF;

    IF v_wallet >= p_fine THEN
        UPDATE users SET wallet = wallet - p_fine WHERE user_id = p_user_id;
        RETURN jsonb_build_object('result', 'fined', 'fine', p_fine);
    END IF;

    v_until := NOW() + (p_jail_hours || ' hours')::INTERVAL;
    UPDATE users SET jailed_until = v_until, jail_reason = p_reason WHERE user_id = p_user_id;
    RETURN jsonb_build_object('result', 'jailed', 'until', v_until);
END $$;
