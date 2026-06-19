-- ============================================================
-- 0020_ai_quota_premium.sql — Quota AI hằng ngày + gói Premium
-- Free: FREE lượt/ngày; Premium (còn hạn): PREMIUM lượt/ngày.
-- ============================================================

alter table users add column if not exists premium_until timestamptz;
alter table users add column if not exists ai_used      int  not null default 0;
alter table users add column if not exists ai_used_date date;

-- Tiêu 1 lượt quota AI (atomic, tự reset theo ngày). Trả jsonb {allowed, used, cap, premium}.
create or replace function consume_ai_quota(p_user_id text, p_free int, p_premium int)
returns jsonb language plpgsql as $$
declare v_used int; v_date date; v_prem timestamptz; v_cap int; v_is_prem boolean; v_today date := current_date;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    select ai_used, ai_used_date, premium_until into v_used, v_date, v_prem from users where user_id=p_user_id;

    v_is_prem := (v_prem is not null and v_prem > now());
    v_cap := case when v_is_prem then p_premium else p_free end;

    -- Sang ngày mới -> reset bộ đếm
    if v_date is distinct from v_today then v_used := 0; end if;

    if v_used >= v_cap then
        return jsonb_build_object('allowed', false, 'used', v_used, 'cap', v_cap, 'premium', v_is_prem);
    end if;

    update users set ai_used = v_used + 1, ai_used_date = v_today where user_id=p_user_id;
    return jsonb_build_object('allowed', true, 'used', v_used + 1, 'cap', v_cap, 'premium', v_is_prem);
end; $$;

-- Cấp/gia hạn Premium thêm p_days ngày (cộng dồn nếu còn hạn). Trả mốc hết hạn mới.
create or replace function grant_premium(p_user_id text, p_days int)
returns timestamptz language plpgsql as $$
declare v_base timestamptz; v_new timestamptz;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    select premium_until into v_base from users where user_id=p_user_id;
    if v_base is null or v_base < now() then v_base := now(); end if;
    v_new := v_base + make_interval(days => p_days);
    update users set premium_until = v_new where user_id=p_user_id;
    return v_new;
end; $$;
