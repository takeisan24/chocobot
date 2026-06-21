import type { User } from "@supabase/supabase-js";

// Trích Discord ID/tên/avatar từ phiên Supabase (provider = discord).
// Discord ID = user_id trong DB game của bot.
export function getDiscordIdentity(user: User | null) {
  if (!user) return { id: null as string | null, username: "Người chơi", avatar: null as string | null };
  const m = (user.user_metadata || {}) as Record<string, unknown>;
  const identity = (user.identities || []).find((i) => i.provider === "discord");
  const idata = (identity?.identity_data || {}) as Record<string, unknown>;

  const id =
    (m.provider_id as string) ||
    (m.sub as string) ||
    (idata.provider_id as string) ||
    (idata.sub as string) ||
    identity?.id ||
    null;

  const username =
    (m.full_name as string) ||
    (m.name as string) ||
    (m.user_name as string) ||
    (m.preferred_username as string) ||
    "Người chơi";

  const avatar = (m.avatar_url as string) || (m.picture as string) || null;

  return { id: id ? String(id) : null, username, avatar };
}
