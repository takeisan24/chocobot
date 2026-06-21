import { createBrowserClient } from "@supabase/ssr";

// Supabase client cho code chạy ở TRÌNH DUYỆT (login, client component).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Chấp nhận cả tên của integration Vercel↔Supabase (ANON_KEY) lẫn tên publishable.
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  );
}
