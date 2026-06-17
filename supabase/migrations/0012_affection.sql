-- ============================================================
-- 0012_affection.sql — Điểm thiện cảm với Waguri (tăng khi trò chuyện).
-- ============================================================
alter table users add column if not exists affection int not null default 0;

create or replace function add_affection(p_user_id text, p_amount int)
returns int language plpgsql as $$
declare v int;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    update users set affection = affection + p_amount where user_id = p_user_id returning affection into v;
    return v;
end; $$;
