import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client cho code chạy ở SERVER (server component, route handler, server action).
// Dùng cookie phiên đăng nhập. Next 16: cookies() là async.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Gọi từ Server Component (không ghi được cookie) -> proxy.ts lo refresh.
          }
        },
      },
    }
  );
}
