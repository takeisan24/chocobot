-- ============================================================
-- 0023_lottery.sql — Xổ số cộng đồng (gom vé, nhà cái cắt %, quay lazy theo thời gian)
-- Không cần scheduler: mỗi lần ai đó tương tác, nếu hết hạn vòng thì quay luôn.
-- ============================================================

create table if not exists lottery_state (
    id          int primary key default 1,
    round_no    int not null default 1,
    pool        bigint not null default 0,
    ends_at     timestamptz not null default now() + interval '24 hours',
    last_winner text,
    last_prize  bigint not null default 0,
    last_round  int
);
insert into lottery_state(id) values (1) on conflict do nothing;

create table if not exists lottery_tickets (
    round_no int not null,
    user_id  text not null,
    tickets  int not null default 0,
    primary key (round_no, user_id)
);

-- Quay thưởng nếu vòng đã hết hạn. Trả jsonb {drawn, winner, prize, round, ...}.
create or replace function lottery_settle(p_cut numeric, p_secs int)
returns jsonb language plpgsql as $$
declare v_round int; v_pool bigint; v_ends timestamptz; v_total int; v_pick int; v_acc int := 0; v_winner text; v_prize bigint; rec record;
begin
    select round_no, pool, ends_at into v_round, v_pool, v_ends from lottery_state where id=1 for update;
    if now() < v_ends then
        return jsonb_build_object('drawn', false);
    end if;

    select coalesce(sum(tickets),0) into v_total from lottery_tickets where round_no = v_round;
    if v_total = 0 then
        update lottery_state set ends_at = now() + make_interval(secs => p_secs) where id=1;
        return jsonb_build_object('drawn', false, 'rolled', true);
    end if;

    v_pick := floor(random() * v_total);          -- 0..total-1
    for rec in select user_id, tickets from lottery_tickets where round_no = v_round order by user_id loop
        v_acc := v_acc + rec.tickets;
        if v_pick < v_acc then v_winner := rec.user_id; exit; end if;
    end loop;

    v_prize := floor(v_pool * (1 - p_cut));
    update users set wallet = wallet + v_prize where user_id = v_winner;
    delete from lottery_tickets where round_no = v_round;
    update lottery_state set round_no = v_round + 1, pool = 0, ends_at = now() + make_interval(secs => p_secs),
        last_winner = v_winner, last_prize = v_prize, last_round = v_round where id=1;

    return jsonb_build_object('drawn', true, 'winner', v_winner, 'prize', v_prize, 'round', v_round, 'total_tickets', v_total);
end; $$;

-- Mua vé (tự settle vòng cũ trước). Trả {status:'ok'|'poor', ...}.
create or replace function lottery_buy(p_user_id text, p_count int, p_price bigint, p_cut numeric, p_secs int)
returns jsonb language plpgsql as $$
declare v_draw jsonb; v_round int; v_ends timestamptz; v_cost bigint; v_upd int; v_tickets int; v_pool bigint;
begin
    insert into users(user_id) values(p_user_id) on conflict(user_id) do nothing;
    v_draw := lottery_settle(p_cut, p_secs);
    select round_no, ends_at into v_round, v_ends from lottery_state where id=1 for update;

    v_cost := p_count::bigint * p_price;
    update users set wallet = wallet - v_cost where user_id = p_user_id and wallet >= v_cost;
    get diagnostics v_upd = row_count;
    if v_upd = 0 then
        return jsonb_build_object('status','poor','cost', v_cost, 'draw', v_draw);
    end if;

    insert into lottery_tickets(round_no, user_id, tickets) values (v_round, p_user_id, p_count)
        on conflict (round_no, user_id) do update set tickets = lottery_tickets.tickets + p_count;
    update lottery_state set pool = pool + v_cost where id=1 returning pool into v_pool;
    select tickets into v_tickets from lottery_tickets where round_no=v_round and user_id=p_user_id;

    return jsonb_build_object('status','ok','my_tickets', v_tickets, 'pool', v_pool, 'round', v_round, 'ends_at', v_ends, 'cost', v_cost, 'draw', v_draw);
end; $$;

-- Xem trạng thái (tự settle nếu hết hạn).
create or replace function lottery_view(p_user_id text, p_cut numeric, p_secs int)
returns jsonb language plpgsql as $$
declare v_draw jsonb; v_round int; v_pool bigint; v_ends timestamptz; v_my int; v_total int; v_lw text; v_lp bigint; v_lr int;
begin
    v_draw := lottery_settle(p_cut, p_secs);
    select round_no, pool, ends_at, last_winner, last_prize, last_round into v_round, v_pool, v_ends, v_lw, v_lp, v_lr from lottery_state where id=1;
    select coalesce(sum(tickets),0) into v_total from lottery_tickets where round_no=v_round;
    select tickets into v_my from lottery_tickets where round_no=v_round and user_id=p_user_id;
    if v_my is null then v_my := 0; end if;
    return jsonb_build_object('round', v_round, 'pool', v_pool, 'ends_at', v_ends, 'my_tickets', v_my, 'total_tickets', v_total,
        'last_winner', v_lw, 'last_prize', v_lp, 'last_round', v_lr, 'draw', v_draw);
end; $$;
