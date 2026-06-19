-- ============================================================
-- 0019_rebalance_interest.sql — Chống lạm phát: giảm lãi ngân hàng
-- 0.5%/ngày -> 0.2%/ngày, và cap tối đa 5.000 VNĐ/ngày (whale-proof).
-- ============================================================

create or replace function claim_daily(p_user_id text)
returns jsonb language plpgsql as $$
declare v_last timestamptz; v_streak int; v_reward bigint; v_bank bigint; v_interest bigint;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    select last_daily, daily_streak, bank into v_last, v_streak, v_bank from users where user_id=p_user_id;
    if v_bank is null then v_bank := 0; end if;

    if v_last is not null and now() < v_last + interval '24 hours' then
        return jsonb_build_object('status','claimed','next', v_last + interval '24 hours');
    end if;

    if v_last is not null and now() < v_last + interval '48 hours' then
        v_streak := coalesce(v_streak,0) + 1;   -- giữ chuỗi
    else
        v_streak := 1;                          -- chuỗi mới / đứt chuỗi
    end if;

    v_reward := 1000 + least(v_streak - 1, 29) * 200;   -- thưởng tăng theo streak (cap ngày 30)
    v_interest := least(floor(v_bank * 0.002), 5000);   -- lãi 0.2%/ngày, cap 5.000 (chống lạm phát)

    update users set
        wallet = wallet + v_reward,
        bank = bank + v_interest,
        last_daily = now(),
        daily_streak = v_streak
        where user_id=p_user_id;

    return jsonb_build_object('status','ok','reward', v_reward, 'streak', v_streak, 'interest', v_interest);
end; $$;
