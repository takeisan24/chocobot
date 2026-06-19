-- ============================================================
-- 0022_hospital_total_assets.sql — Viện phí tính trên TỔNG tài sản (ví+bank)
-- Chặn lách bằng cách gửi hết tiền vào bank rồi nhập viện chỉ 500.
-- Trừ ví trước, thiếu thì trừ tiếp vào bank.
-- ============================================================

create or replace function hospital_heal(p_user_id text)
returns jsonb language plpgsql as $$
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
    v_fee := greatest(500, floor(v_total * 0.1));

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
