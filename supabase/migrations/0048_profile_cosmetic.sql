-- ============================================================
-- 0048_profile_cosmetic.sql — Thêm title + profile_color vào hồ sơ công khai.
-- (cột đã có ở 0025_cosmetics). Chỉ cập nhật RPC get_public_profile. Idempotent.
-- ============================================================
create or replace function get_public_profile(p_user_id text)
returns jsonb
language plpgsql
stable
as $$
declare r jsonb;
begin
    select jsonb_build_object(
        'exists', true,
        'public', coalesce(u.profile_public, true),
        'wallet', u.wallet,
        'bank', u.bank,
        'exp', u.exp,
        'job', j.name,
        'affection', coalesce(u.affection, 0),
        'partner_id', u.partner_id,
        'clan', c.name,
        'title', u.title,
        'color', u.profile_color,
        'achievements', (select count(*) from achievements a where a.user_id = u.user_id),
        'wealth_rank', (select count(*) + 1 from users uu where (uu.wallet + uu.bank) > (u.wallet + u.bank))
    ) into r
    from users u
    left join jobs j on j.id = u.job_id
    left join clans c on c.id = u.clan_id
    where u.user_id = p_user_id;

    if r is null then return jsonb_build_object('exists', false); end if;
    return r;
end;
$$;
