-- ============================================================
-- 0032_game_event.sql — Sự kiện nhân thu nhập/EXP toàn cục (vd Tết x2)
-- ============================================================
create table if not exists game_event (
    id         int primary key default 1,
    multiplier numeric not null default 1,
    ends_at    timestamptz,
    name       text
);
insert into game_event(id) values (1) on conflict (id) do nothing;
