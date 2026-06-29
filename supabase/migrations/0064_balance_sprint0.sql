-- ============================================================
-- 0064_balance_sprint0.sql — Cân bằng (theo phản hồi tester)
--  1) regen_energy: hồi +1 mỗi 30s (trước 60s) — giảm cảm giác cày năng lượng.
--  2) hospital_heal: viện phí CỐ ĐỊNH 3.000 (trước 10% tổng tài sản, quá nhiều).
-- create or replace RESET search_path -> phải pin lại (giữ bảo mật như 0055/0062).
-- ============================================================

-- ---------- 1) Hồi năng lượng nhanh hơn: 1 điểm / 30 giây ----------
create or replace function regen_energy(p_user_id text)
returns int language plpgsql
set search_path = pg_catalog, public
as $$
declare v_e int; v_t timestamptz; v_ticks int; v_new int;
begin
    insert into users (user_id) values (p_user_id) on conflict (user_id) do nothing;
    select energy, energy_updated_at into v_e, v_t from users where user_id = p_user_id;
    if v_e is null then v_e := 100; end if;
    if v_t is null then v_t := now(); end if;

    if v_e >= 100 then
        update users set energy_updated_at = now() where user_id = p_user_id and energy >= 100;
        return v_e;
    end if;

    v_ticks := floor(extract(epoch from (now() - v_t)) / 30);   -- 30s/điểm
    if v_ticks <= 0 then return v_e; end if;

    v_new := least(100, v_e + v_ticks);
    update users set energy = v_new,
        energy_updated_at = case when v_new >= 100 then now() else v_t + (v_ticks * interval '30 seconds') end
        where user_id = p_user_id;
    return v_new;
end; $$;

-- ---------- 2) Viện phí CỐ ĐỊNH 3.000 VNĐ ----------
create or replace function hospital_heal(p_user_id text)
returns jsonb language plpgsql
set search_path = pg_catalog, public
as $$
declare v_wallet bigint; v_bank bigint; v_health int; v_total bigint; v_fee bigint; v_from_wallet bigint; v_from_bank bigint;
begin
    select wallet, bank, health into v_wallet, v_bank, v_health from users where user_id = p_user_id;
    if v_wallet is null then
        insert into users (user_id) values (p_user_id) on conflict (user_id) do nothing;
        select wallet, bank, health into v_wallet, v_bank, v_health from users where user_id = p_user_id;
    end if;
    if v_health is null then v_health := 100; end if;
    if v_wallet is null then v_wallet := 0; end if;
    if v_bank   is null then v_bank   := 0; end if;

    if v_health >= 100 then
        return jsonb_build_object('status', 'already_healthy', 'fee', 0);
    end if;

    v_total := v_wallet + v_bank;
    v_fee := 3000;   -- CỐ ĐỊNH (trước: greatest(500, floor(v_total * 0.1)))

    if v_total < v_fee then
        return jsonb_build_object('status', 'insufficient_funds', 'fee', v_fee);
    end if;

    v_from_wallet := least(v_wallet, v_fee);   -- trừ ví trước
    v_from_bank := v_fee - v_from_wallet;       -- thiếu thì trừ bank

    update users set
        wallet = wallet - v_from_wallet,
        bank   = bank - v_from_bank,
        health = 100
        where user_id = p_user_id;

    return jsonb_build_object('status', 'ok', 'fee', v_fee, 'from_wallet', v_from_wallet, 'from_bank', v_from_bank);
end; $$;
