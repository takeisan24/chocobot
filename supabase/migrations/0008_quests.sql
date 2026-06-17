-- ============================================================
-- 0008_quests.sql — Nhiệm vụ hằng ngày (reset theo ngày UTC).
--   quest_progress: counters (đếm tiến độ) + claimed (đã nhận thưởng) theo ngày.
--   RPC quest_incr: cộng tiến độ atomic. quest_claim: nhận thưởng atomic.
-- ============================================================
create table if not exists quest_progress (
    user_id    text not null,
    quest_date date not null default current_date,
    counters   jsonb not null default '{}',
    claimed    jsonb not null default '{}',
    primary key (user_id, quest_date)
);

-- Cộng tiến độ một loại nhiệm vụ cho NGÀY HÔM NAY.
create or replace function quest_incr(p_user_id text, p_key text, p_amount int)
returns void language plpgsql as $$
begin
    insert into quest_progress (user_id, quest_date, counters)
        values (p_user_id, current_date, jsonb_build_object(p_key, p_amount))
    on conflict (user_id, quest_date) do update set counters = jsonb_set(
        quest_progress.counters,
        array[p_key],
        (coalesce((quest_progress.counters->>p_key)::bigint, 0) + p_amount)::text::jsonb,
        true
    );
end; $$;

-- Nhận thưởng 1 nhiệm vụ. Trả 'ok' | 'claimed' | 'not_done'.
create or replace function quest_claim(
    p_user_id text, p_quest_id text, p_key text, p_required bigint, p_reward bigint
)
returns text language plpgsql as $$
declare v_counters jsonb; v_claimed jsonb; v_cur bigint;
begin
    select counters, claimed into v_counters, v_claimed
        from quest_progress where user_id = p_user_id and quest_date = current_date;

    v_counters := coalesce(v_counters, '{}'::jsonb);
    v_claimed  := coalesce(v_claimed, '{}'::jsonb);

    if v_claimed ? p_quest_id then return 'claimed'; end if;
    v_cur := coalesce((v_counters->>p_key)::bigint, 0);
    if v_cur < p_required then return 'not_done'; end if;

    insert into quest_progress (user_id, quest_date, claimed)
        values (p_user_id, current_date, jsonb_build_object(p_quest_id, true))
    on conflict (user_id, quest_date) do update
        set claimed = quest_progress.claimed || jsonb_build_object(p_quest_id, true);

    insert into users (user_id) values (p_user_id) on conflict (user_id) do nothing;
    update users set wallet = wallet + p_reward where user_id = p_user_id;
    return 'ok';
end; $$;
