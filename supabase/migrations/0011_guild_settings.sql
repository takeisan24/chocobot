-- ============================================================
-- 0011_guild_settings.sql — Cấu hình theo từng server (bước đệm multi-server).
-- settings là jsonb để dễ mở rộng (confession_channel, welcome_channel, ...).
-- ============================================================
create table if not exists guild_settings (
    guild_id   text primary key,
    settings   jsonb not null default '{}',
    updated_at timestamptz not null default now()
);

-- Đặt 1 khóa cấu hình (merge vào jsonb). p_value lưu dạng chuỗi.
create or replace function set_guild_setting(p_guild text, p_key text, p_value text)
returns void language plpgsql as $$
begin
    insert into guild_settings (guild_id, settings)
        values (p_guild, jsonb_build_object(p_key, p_value))
    on conflict (guild_id) do update
        set settings = guild_settings.settings || jsonb_build_object(p_key, p_value),
            updated_at = now();
end; $$;
