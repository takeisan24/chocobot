-- ============================================================
-- 0010_marriage.sql — Kết đôi/cưới giữa người chơi.
-- ============================================================
alter table users add column if not exists partner_id text;
alter table users add column if not exists married_at timestamptz;

-- Kết hôn 2 người atomic. Trả 'ok' | 'already' (1 trong 2 đã có đôi) | 'self'.
create or replace function marry_users(p_a text, p_b text)
returns text language plpgsql as $$
declare a_p text; b_p text;
begin
    if p_a = p_b then return 'self'; end if;
    insert into users(user_id) values (p_a) on conflict (user_id) do nothing;
    insert into users(user_id) values (p_b) on conflict (user_id) do nothing;

    select partner_id into a_p from users where user_id = p_a;
    select partner_id into b_p from users where user_id = p_b;
    if a_p is not null or b_p is not null then return 'already'; end if;

    update users set partner_id = p_b, married_at = now() where user_id = p_a;
    update users set partner_id = p_a, married_at = now() where user_id = p_b;
    return 'ok';
end; $$;

-- Ly hôn: xóa quan hệ ở cả hai phía. Trả 'ok' | 'single'.
create or replace function divorce_user(p_user text)
returns text language plpgsql as $$
declare v_p text;
begin
    select partner_id into v_p from users where user_id = p_user;
    if v_p is null then return 'single'; end if;
    update users set partner_id = null, married_at = null where user_id in (p_user, v_p);
    return 'ok';
end; $$;
