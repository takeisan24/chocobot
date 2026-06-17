-- ============================================================
-- 0005_sprint2.sql — Daily, Bank transfer, Leaderboard
-- ============================================================

alter table users add column if not exists last_daily   timestamptz;
alter table users add column if not exists daily_streak int not null default 0;

-- Điểm danh hằng ngày + streak (rolling 24h, đứt chuỗi nếu quá 48h).
-- Trả jsonb: {status:'ok',reward,streak} | {status:'claimed',next}
create or replace function claim_daily(p_user_id text)
returns jsonb language plpgsql as $$
declare v_last timestamptz; v_streak int; v_reward bigint;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    select last_daily, daily_streak into v_last, v_streak from users where user_id=p_user_id;

    if v_last is not null and now() < v_last + interval '24 hours' then
        return jsonb_build_object('status','claimed','next', v_last + interval '24 hours');
    end if;

    if v_last is not null and now() < v_last + interval '48 hours' then
        v_streak := coalesce(v_streak,0) + 1;   -- giữ chuỗi
    else
        v_streak := 1;                          -- chuỗi mới / đứt chuỗi
    end if;

    v_reward := 1000 + least(v_streak - 1, 29) * 200;  -- thưởng tăng theo streak (cap ngày 30)
    update users set wallet = wallet + v_reward, last_daily = now(), daily_streak = v_streak
        where user_id=p_user_id;
    return jsonb_build_object('status','ok','reward', v_reward, 'streak', v_streak);
end; $$;

-- Chuyển tiền ví <-> ngân hàng nguyên tử. p_to_bank=true: gửi (ví->bank).
create or replace function transfer_bank(p_user_id text, p_amount bigint, p_to_bank boolean)
returns boolean language plpgsql as $$
declare v_upd int;
begin
    if p_amount <= 0 then return false; end if;
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    if p_to_bank then
        update users set wallet = wallet - p_amount, bank = bank + p_amount
            where user_id=p_user_id and wallet >= p_amount;
    else
        update users set bank = bank - p_amount, wallet = wallet + p_amount
            where user_id=p_user_id and bank >= p_amount;
    end if;
    get diagnostics v_upd = row_count;
    return v_upd > 0;
end; $$;

-- Bảng xếp hạng: p_sort='level' theo exp, ngược lại theo tài sản (wallet+bank).
create or replace function leaderboard_rows(p_sort text, p_limit int)
returns table(user_id text, networth bigint, exp int)
language sql as $$
    select user_id, (wallet+bank)::bigint as networth, exp from users
    order by case when p_sort='level' then exp::bigint else (wallet+bank) end desc
    limit p_limit
$$;
