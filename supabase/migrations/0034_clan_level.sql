-- ============================================================
-- 0034_clan_level.sql — Cấp bang (XP từ góp quỹ) + cổ tức bang khi /daily
-- Cấp bang = floor(sqrt(xp/10000)) + 1. Cổ tức ngày = cấp * 100 cho mỗi thành viên.
-- ============================================================

alter table clans add column if not exists xp bigint not null default 0;

create or replace function clan_deposit(p_user text, p_amount bigint)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_upd int; v_bank bigint;
begin
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is null then return jsonb_build_object('status','not_in'); end if;
    update users set wallet = wallet - p_amount where user_id = p_user and wallet >= p_amount;
    get diagnostics v_upd = row_count;
    if v_upd = 0 then return jsonb_build_object('status','poor'); end if;
    update clans set bank = bank + p_amount, xp = xp + p_amount where id = v_clan returning bank into v_bank;
    return jsonb_build_object('status','ok','bank', v_bank);
end; $$;

create or replace function claim_daily(p_user_id text)
returns jsonb language plpgsql as $$
declare
    v_last timestamptz; v_streak int; v_reward bigint; v_wallet bigint; v_bank bigint;
    v_interest bigint; v_milestone bigint := 0; v_assets bigint; v_tax bigint;
    v_clan bigint; v_cxp bigint; v_clevel int; v_dividend bigint := 0;
    c_threshold constant bigint := 100000;
    c_rate constant numeric := 0.01;
    c_cap constant bigint := 50000;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    select last_daily, daily_streak, wallet, bank, clan_id into v_last, v_streak, v_wallet, v_bank, v_clan from users where user_id=p_user_id;
    if v_wallet is null then v_wallet := 0; end if;
    if v_bank   is null then v_bank   := 0; end if;

    if v_last is not null and now() < v_last + interval '24 hours' then
        return jsonb_build_object('status','claimed','next', v_last + interval '24 hours');
    end if;

    if v_last is not null and now() < v_last + interval '48 hours' then
        v_streak := coalesce(v_streak,0) + 1;
    else
        v_streak := 1;
    end if;

    v_reward := 1000 + least(v_streak - 1, 29) * 200;
    if v_streak = 7 then v_milestone := 2000;
    elsif v_streak = 14 then v_milestone := 5000;
    elsif v_streak = 30 then v_milestone := 20000;
    end if;
    v_reward := v_reward + v_milestone;

    v_interest := least(floor(v_bank * 0.002), 5000);

    if v_clan is not null then
        select xp into v_cxp from clans where id = v_clan;
        v_clevel := floor(sqrt(coalesce(v_cxp,0) / 10000.0)) + 1;
        v_dividend := v_clevel * 100;
        v_reward := v_reward + v_dividend;
    end if;

    v_assets := v_wallet + v_bank;
    v_tax := least(floor(greatest(0, v_assets - c_threshold) * c_rate), c_cap);

    v_wallet := v_wallet + v_reward;
    v_bank   := v_bank + v_interest;

    if v_tax <= v_bank then
        v_bank := v_bank - v_tax;
    else
        v_wallet := v_wallet - (v_tax - v_bank);
        v_bank := 0;
    end if;

    update users set wallet = v_wallet, bank = v_bank, last_daily = now(), daily_streak = v_streak
        where user_id=p_user_id;

    return jsonb_build_object('status','ok','reward', v_reward, 'streak', v_streak,
        'interest', v_interest, 'milestone', v_milestone, 'tax', v_tax, 'clan_dividend', v_dividend);
end; $$;
