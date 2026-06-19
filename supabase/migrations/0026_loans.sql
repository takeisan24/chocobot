-- ============================================================
-- 0026_loans.sql — Vay/đòi nợ giữa người chơi (P2P, không tạo tiền mới)
-- Lãi cố định khi vay; quá hạn -> chủ nợ cưỡng chế thu (ví trước, rồi bank).
-- ============================================================

create table if not exists loans (
    id          bigserial primary key,
    lender_id   text not null,
    borrower_id text not null,
    principal   bigint not null,
    remaining   bigint not null,            -- còn nợ (gồm lãi)
    created_at  timestamptz not null default now(),
    due_at      timestamptz not null,
    status      text not null default 'active'  -- 'active' | 'paid'
);
create index if not exists idx_loans_borrower on loans(borrower_id, status);
create index if not exists idx_loans_lender on loans(lender_id, status);

-- Tạo khoản vay: trừ ví người cho vay, cộng ví người vay, ghi nợ = principal*(1+lãi).
create or replace function loan_create(p_lender text, p_borrower text, p_principal bigint, p_interest numeric, p_days int)
returns jsonb language plpgsql as $$
declare v_upd int; v_due bigint; v_id bigint; v_when timestamptz;
begin
    insert into users(user_id) values(p_lender) on conflict(user_id) do nothing;
    insert into users(user_id) values(p_borrower) on conflict(user_id) do nothing;

    update users set wallet = wallet - p_principal where user_id = p_lender and wallet >= p_principal;
    get diagnostics v_upd = row_count;
    if v_upd = 0 then return jsonb_build_object('status','poor'); end if;

    update users set wallet = wallet + p_principal where user_id = p_borrower;
    v_due := floor(p_principal * (1 + p_interest));
    v_when := now() + make_interval(days => p_days);
    insert into loans(lender_id, borrower_id, principal, remaining, due_at)
        values (p_lender, p_borrower, p_principal, v_due, v_when) returning id into v_id;
    return jsonb_build_object('status','ok','loan_id', v_id, 'remaining', v_due, 'due_at', v_when);
end; $$;

-- Trả nợ: borrower trả tới p_amount cho lender (các khoản cũ trước). Trừ ví borrower.
create or replace function loan_repay(p_borrower text, p_lender text, p_amount bigint)
returns jsonb language plpgsql as $$
declare v_wallet bigint; v_total bigint; v_pay bigint; v_left bigint; rec record;
begin
    select wallet into v_wallet from users where user_id = p_borrower;
    v_wallet := coalesce(v_wallet, 0);
    select coalesce(sum(remaining),0) into v_total from loans where borrower_id=p_borrower and lender_id=p_lender and status='active';
    if v_total = 0 then return jsonb_build_object('status','none'); end if;

    v_pay := least(p_amount, v_total, v_wallet);
    if v_pay <= 0 then return jsonb_build_object('status','poor','remaining', v_total); end if;

    update users set wallet = wallet - v_pay where user_id = p_borrower;
    update users set wallet = wallet + v_pay where user_id = p_lender;

    v_left := v_pay;
    for rec in select id, remaining from loans where borrower_id=p_borrower and lender_id=p_lender and status='active' order by created_at loop
        exit when v_left <= 0;
        if rec.remaining <= v_left then
            update loans set remaining = 0, status = 'paid' where id = rec.id;
            v_left := v_left - rec.remaining;
        else
            update loans set remaining = remaining - v_left where id = rec.id;
            v_left := 0;
        end if;
    end loop;

    select coalesce(sum(remaining),0) into v_total from loans where borrower_id=p_borrower and lender_id=p_lender and status='active';
    return jsonb_build_object('status','ok','paid', v_pay, 'remaining', v_total);
end; $$;

-- Đòi nợ: chỉ với khoản QUÁ HẠN. Cưỡng chế thu từ ví trước rồi bank của borrower.
create or replace function loan_collect(p_lender text, p_borrower text)
returns jsonb language plpgsql as $$
declare v_overdue bigint; v_wallet bigint; v_bank bigint; v_take bigint; v_from_w bigint; v_from_b bigint; v_left bigint; rec record;
begin
    select coalesce(sum(remaining),0) into v_overdue from loans
        where lender_id=p_lender and borrower_id=p_borrower and status='active' and due_at <= now();
    if v_overdue = 0 then return jsonb_build_object('status','not_overdue'); end if;

    select wallet, bank into v_wallet, v_bank from users where user_id = p_borrower;
    v_wallet := coalesce(v_wallet,0); v_bank := coalesce(v_bank,0);
    v_take := least(v_overdue, v_wallet + v_bank);
    if v_take <= 0 then return jsonb_build_object('status','broke','overdue', v_overdue); end if;

    v_from_w := least(v_wallet, v_take);
    v_from_b := v_take - v_from_w;
    update users set wallet = wallet - v_from_w, bank = bank - v_from_b where user_id = p_borrower;
    update users set wallet = wallet + v_take where user_id = p_lender;

    v_left := v_take;
    for rec in select id, remaining from loans where lender_id=p_lender and borrower_id=p_borrower and status='active' and due_at <= now() order by created_at loop
        exit when v_left <= 0;
        if rec.remaining <= v_left then
            update loans set remaining = 0, status = 'paid' where id = rec.id;
            v_left := v_left - rec.remaining;
        else
            update loans set remaining = remaining - v_left where id = rec.id;
            v_left := 0;
        end if;
    end loop;

    return jsonb_build_object('status','ok','collected', v_take, 'from_wallet', v_from_w, 'from_bank', v_from_b, 'overdue_left', v_overdue - v_take);
end; $$;
