-- ============================================================
-- 0014_atomic_give_tax.sql — Chuyển tiền nguyên tử kèm khấu trừ thuế
-- Trả boolean: true nếu thành công, false nếu không đủ tiền / lỗi.
-- ============================================================
create or replace function transfer_money_with_tax(
    p_from    text,
    p_to      text,
    p_amount  bigint,
    p_tax_pct real
)
returns boolean
language plpgsql
as $$
declare
    affected int;
    v_tax bigint;
    v_net bigint;
begin
    if p_amount <= 0 or p_from = p_to then
        return false;
    end if;

    v_tax := floor(p_amount * p_tax_pct);
    v_net := p_amount - v_tax;

    insert into users (user_id) values (p_from) on conflict (user_id) do nothing;
    insert into users (user_id) values (p_to)   on conflict (user_id) do nothing;

    -- Trừ toàn bộ số tiền từ ví người gửi
    update users set wallet = wallet - p_amount
        where user_id = p_from and wallet >= p_amount;
    get diagnostics affected = row_count;
    if affected = 0 then
        return false;  -- không đủ tiền
    end if;

    -- Cộng số tiền sau thuế cho ví người nhận
    update users set wallet = wallet + v_net where user_id = p_to;
    return true;
end;
$$;
