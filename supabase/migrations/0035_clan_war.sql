-- ============================================================
-- 0035_clan_war.sql — Chiến tranh bang: chuyển cược từ bang thua sang bang thắng
-- ============================================================
create or replace function clan_war(p_winner bigint, p_loser bigint, p_stake bigint)
returns jsonb language plpgsql as $$
declare v_bank bigint; v_take bigint;
begin
    select bank into v_bank from clans where id = p_loser for update;
    if v_bank is null then return jsonb_build_object('status','notfound'); end if;
    v_take := least(p_stake, v_bank);
    if v_take < 0 then v_take := 0; end if;
    update clans set bank = bank - v_take where id = p_loser;
    update clans set bank = bank + v_take where id = p_winner;
    return jsonb_build_object('status','ok','taken', v_take);
end; $$;
