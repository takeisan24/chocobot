import { createBrowserClient } from "@supabase/ssr";

// Supabase client cho code chạy ở TRÌNH DUYỆT (login, client component).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
