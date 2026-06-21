"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import { getDiscordIdentity } from "../../lib/discord";

// Lấy Discord ID của phiên đăng nhập đã xác thực (không tin tham số từ client).
async function sessionDiscordId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return getDiscordIdentity(user).id;
}

export async function toggleProfilePublic() {
  const id = await sessionDiscordId();
  if (!id) return;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("profile_public").eq("user_id", id).single();
  const next = !((data?.profile_public ?? true) as boolean);
  await admin.from("users").update({ profile_public: next }).eq("user_id", id);
  revalidatePath("/dashboard");
}

export async function toggleVoteReminder() {
  const id = await sessionDiscordId();
  if (!id) return;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("vote_reminder").eq("user_id", id).single();
  const next = !((data?.vote_reminder ?? true) as boolean);
  await admin.from("users").update({ vote_reminder: next }).eq("user_id", id);
  revalidatePath("/dashboard");
}
