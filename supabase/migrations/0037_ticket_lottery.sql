-- ============================================================
-- 0037_ticket_lottery.sql — Hệ thống vé số Waguri tự động
-- ============================================================

DROP TABLE IF EXISTS xoso_bets CASCADE;
DROP TABLE IF EXISTS xoso_results CASCADE;
DROP TABLE IF EXISTS lottery_tickets CASCADE;
DROP TABLE IF EXISTS lottery_state CASCADE;

CREATE TABLE lottery_state (
    id              INT PRIMARY KEY DEFAULT 1,
    round_no        INT NOT NULL DEFAULT 1,
    reward_type     TEXT NOT NULL,
    reward_value    TEXT NOT NULL,
    reward_name     TEXT NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,
    last_winner     TEXT, -- description of winners
    last_ticket     TEXT, -- 5-digit winning number
    last_reward     TEXT,
    last_round      INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lottery_tickets (
    round_no        INT NOT NULL,
    user_id         TEXT NOT NULL,
    ticket_number   TEXT NOT NULL, -- 5-digit number e.g. '05281'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (round_no, user_id)
);

-- RPC to claim a ticket for the current round
CREATE OR REPLACE FUNCTION lottery_claim_ticket(
    p_user_id TEXT,
    p_ticket_number TEXT,
    p_def_reward_type TEXT,
    p_def_reward_value TEXT,
    p_def_reward_name TEXT,
    p_duration_secs INT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_round INT;
    v_ends TIMESTAMPTZ;
    v_ticket TEXT;
    v_reward_type TEXT;
    v_reward_value TEXT;
    v_reward_name TEXT;
BEGIN
    -- Ensure state exists
    IF NOT EXISTS (SELECT 1 FROM lottery_state WHERE id = 1) THEN
        INSERT INTO lottery_state(id, round_no, reward_type, reward_value, reward_name, ends_at)
        VALUES (1, 1, p_def_reward_type, p_def_reward_value, p_def_reward_name, now() + make_interval(secs => p_duration_secs));
    END IF;

    SELECT round_no, ends_at, reward_type, reward_value, reward_name
    INTO v_round, v_ends, v_reward_type, v_reward_value, v_reward_name
    FROM lottery_state WHERE id = 1 FOR UPDATE;

    -- Check if user already has a ticket
    SELECT ticket_number INTO v_ticket FROM lottery_tickets WHERE round_no = v_round AND user_id = p_user_id;

    IF v_ticket IS NOT NULL THEN
        RETURN jsonb_build_object(
            'status', 'already',
            'round', v_round,
            'ticket', v_ticket,
            'ends_at', v_ends,
            'reward_name', v_reward_name
        );
    END IF;

    -- Assign new ticket
    INSERT INTO lottery_tickets(round_no, user_id, ticket_number)
    VALUES (v_round, p_user_id, p_ticket_number);

    RETURN jsonb_build_object(
        'status', 'ok',
        'round', v_round,
        'ticket', p_ticket_number,
        'ends_at', v_ends,
        'reward_name', v_reward_name
    );
END;
$$;

-- RPC to save the result and advance to the next round
CREATE OR REPLACE FUNCTION lottery_save_draw_result(
    p_round_no INT,
    p_winning_number TEXT,
    p_next_reward_type TEXT,
    p_next_reward_value TEXT,
    p_next_reward_name TEXT,
    p_duration_secs INT,
    p_last_winner_desc TEXT,
    p_last_reward_desc TEXT
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE lottery_state
    SET round_no = p_round_no + 1,
        reward_type = p_next_reward_type,
        reward_value = p_next_reward_value,
        reward_name = p_next_reward_name,
        ends_at = now() + make_interval(secs => p_duration_secs),
        last_winner = p_last_winner_desc,
        last_ticket = p_winning_number,
        last_reward = p_last_reward_desc,
        last_round = p_round_no
    WHERE id = 1;
END;
$$;
