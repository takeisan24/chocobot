import { createClient } from "@supabase/supabase-js";

// Client SERVICE-ROLE để đọc/ghi dữ liệu game (bypass RLS). CHỈ DÙNG Ở SERVER.
// Luôn lọc theo Discord ID của phiên đăng nhập đã xác thực — không bao giờ tin tham số từ client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
