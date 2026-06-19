-- ============================================================
-- 0028_couple_love.sql — Điểm tình cảm cặp đôi (/hug /kiss /date)
-- ============================================================

alter table users add column if not exists love bigint not null default 0;

-- Tăng điểm tình cảm cho cả hai vợ chồng. Trả {status, love, partner}.
create or replace function couple_love(p_user text, p_amount int)
returns jsonb language plpgsql as $$
declare v_partner text; v_love bigint;
begin
    select partner_id into v_partner from users where user_id = p_user;
    if v_partner is null then return jsonb_build_object('status','single'); end if;
    update users set love = coalesce(love,0) + p_amount where user_id in (p_user, v_partner);
    select love into v_love from users where user_id = p_user;
    return jsonb_build_object('status','ok','love', v_love, 'partner', v_partner);
end; $$;
