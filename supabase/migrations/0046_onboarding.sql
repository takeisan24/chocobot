-- ============================================================
-- 0046_onboarding.sql — Onboarding theo từng user + chào quay lại.
--   onboarded: đã nhận quà chào mừng 1 lần chưa.
--   last_seen: lần "điểm danh hiện diện" gần nhất (để chào người vắng lâu).
-- Idempotent.
-- ============================================================

alter table users add column if not exists onboarded boolean not null default false;
alter table users add column if not exists last_seen timestamptz;

-- Nhận quà chào mừng 1 lần DUY NHẤT (nguyên tử, chống nhận trùng).
-- Trả số tiền đã thưởng (>0) nếu nhận được; 0 nếu đã nhận trước đó.
create or replace function claim_welcome_bonus(p_user_id text, p_amount bigint)
returns bigint
language plpgsql
as $$
declare
    v_ok boolean;
begin
    insert into users(user_id) values (p_user_id) on conflict (user_id) do nothing;
    update users set onboarded = true, wallet = wallet + p_amount
    where user_id = p_user_id and onboarded = false
    returning true into v_ok;
    if v_ok then return p_amount; else return 0; end if;
end;
$$;

-- Cập nhật last_seen = now(), trả về giá trị CŨ (để biết vắng bao lâu).
create or replace function touch_last_seen(p_user_id text)
returns timestamptz
language plpgsql
as $$
declare
    v_prev timestamptz;
begin
    insert into users(user_id) values (p_user_id) on conflict (user_id) do nothing;
    select last_seen into v_prev from users where user_id = p_user_id;
    update users set last_seen = now() where user_id = p_user_id;
    return v_prev;
end;
$$;
