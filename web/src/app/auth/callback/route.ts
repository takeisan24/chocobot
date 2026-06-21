import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Đích redirect sau khi Supabase xử lý OAuth Discord -> đổi code lấy phiên.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/dashboard`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
