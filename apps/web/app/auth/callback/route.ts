import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  console.log("[Auth Callback] Processing callback - code exists:", !!code);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    console.log(
      "[Auth Callback] Session created successfully for user:",
      data.user?.email,
    );
  }

  // Redirect to home after successful authentication
  console.log("[Auth Callback] Redirecting to:", origin);
  return NextResponse.redirect(`${origin}`);
}
