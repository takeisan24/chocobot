-- ============================================================
-- 0030_clans.sql — Bang hội (clan): lập bang, gia nhập, quỹ chung
-- ============================================================

create table if not exists clans (
    id         bigserial primary key,
    name       text unique not null,
    leader_id  text not null,
    bank       bigint not null default 0,
    created_at timestamptz not null default now()
);
alter table users add column if not exists clan_id bigint;

-- Lập bang (tốn phí = sink). Trả {status, id}.
create or replace function clan_create(p_user text, p_name text, p_cost bigint)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_id bigint; v_upd int;
begin
    insert into users(user_id) values(p_user) on conflict(user_id) do nothing;
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is not null then return jsonb_build_object('status','in_clan'); end if;
    if exists (select 1 from clans where lower(name) = lower(p_name)) then return jsonb_build_object('status','name_taken'); end if;
    update users set wallet = wallet - p_cost where user_id = p_user and wallet >= p_cost;
    get diagnostics v_upd = row_count;
    if v_upd = 0 then return jsonb_build_object('status','poor'); end if;
    insert into clans(name, leader_id) values (p_name, p_user) returning id into v_id;
    update users set clan_id = v_id where user_id = p_user;
    return jsonb_build_object('status','ok','id', v_id);
end; $$;

-- Gia nhập theo tên bang.
create or replace function clan_join(p_user text, p_name text)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_id bigint; v_cname text;
begin
    insert into users(user_id) values(p_user) on conflict(user_id) do nothing;
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is not null then return jsonb_build_object('status','in_clan'); end if;
    select id, name into v_id, v_cname from clans where lower(name) = lower(p_name);
    if v_id is null then return jsonb_build_object('status','notfound'); end if;
    update users set clan_id = v_id where user_id = p_user;
    return jsonb_build_object('status','ok','id', v_id, 'name', v_cname);
end; $$;

-- Rời bang (trưởng bang phải giải tán/đuổi trước).
create or replace function clan_leave(p_user text)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_leader text;
begin
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is null then return jsonb_build_object('status','not_in'); end if;
    select leader_id into v_leader from clans where id = v_clan;
    if v_leader = p_user then return jsonb_build_object('status','is_leader'); end if;
    update users set clan_id = null where user_id = p_user;
    return jsonb_build_object('status','ok');
end; $$;

-- Góp quỹ bang (member -> quỹ).
create or replace function clan_deposit(p_user text, p_amount bigint)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_upd int; v_bank bigint;
begin
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is null then return jsonb_build_object('status','not_in'); end if;
    update users set wallet = wallet - p_amount where user_id = p_user and wallet >= p_amount;
    get diagnostics v_upd = row_count;
    if v_upd = 0 then return jsonb_build_object('status','poor'); end if;
    update clans set bank = bank + p_amount where id = v_clan returning bank into v_bank;
    return jsonb_build_object('status','ok','bank', v_bank);
end; $$;

-- Rút quỹ bang (chỉ trưởng bang).
create or replace function clan_withdraw(p_user text, p_amount bigint)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_leader text; v_bank bigint;
begin
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is null then return jsonb_build_object('status','not_in'); end if;
    select leader_id, bank into v_leader, v_bank from clans where id = v_clan;
    if v_leader <> p_user then return jsonb_build_object('status','not_leader'); end if;
    if v_bank < p_amount then return jsonb_build_object('status','poor_clan','bank', v_bank); end if;
    update clans set bank = bank - p_amount where id = v_clan;
    update users set wallet = wallet + p_amount where user_id = p_user;
    return jsonb_build_object('status','ok');
end; $$;

-- Đuổi thành viên (chỉ trưởng bang).
create or replace function clan_kick(p_leader text, p_target text)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_leader text; v_tclan bigint;
begin
    select clan_id into v_clan from users where user_id = p_leader;
    if v_clan is null then return jsonb_build_object('status','not_in'); end if;
    select leader_id into v_leader from clans where id = v_clan;
    if v_leader <> p_leader then return jsonb_build_object('status','not_leader'); end if;
    if p_target = p_leader then return jsonb_build_object('status','self'); end if;
    select clan_id into v_tclan from users where user_id = p_target;
    if v_tclan is distinct from v_clan then return jsonb_build_object('status','not_member'); end if;
    update users set clan_id = null where user_id = p_target;
    return jsonb_build_object('status','ok');
end; $$;

-- Giải tán bang (chỉ trưởng bang). Quỹ còn lại trả về trưởng bang.
create or replace function clan_disband(p_user text)
returns jsonb language plpgsql as $$
declare v_clan bigint; v_leader text; v_bank bigint;
begin
    select clan_id into v_clan from users where user_id = p_user;
    if v_clan is null then return jsonb_build_object('status','not_in'); end if;
    select leader_id, bank into v_leader, v_bank from clans where id = v_clan;
    if v_leader <> p_user then return jsonb_build_object('status','not_leader'); end if;
    update users set clan_id = null where clan_id = v_clan;
    if v_bank > 0 then update users set wallet = wallet + v_bank where user_id = p_user; end if;
    delete from clans where id = v_clan;
    return jsonb_build_object('status','ok','refund', v_bank);
end; $$;
