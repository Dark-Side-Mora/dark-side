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

    // Verify session was created successfully with valid token
    if (!data.session) {
      console.error("[Auth Callback] No session returned from code exchange");
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent("Failed to create session")}`,
      );
    }

    // Verify access token exists and is not expired
    if (!data.session.access_token) {
      console.error("[Auth Callback] No access token in session");
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent("Invalid session token")}`,
      );
    }

    // Verify user info is available
    if (!data.user) {
      console.error("[Auth Callback] No user information in session");
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent("Failed to retrieve user information")}`,
      );
    }

    console.log("[Auth Callback] ✓ Session created successfully", {
      userId: data.user.id,
      email: data.user.email,
      provider: data.user.app_metadata?.provider,
      tokenExpires: new Date(
        data.session.expires_at ? data.session.expires_at * 1000 : 0,
      ).toISOString(),
    });
  } else {
    console.warn("[Auth Callback] No code provided in callback");
  }

  // Redirect to home after successful authentication
  console.log("[Auth Callback] Redirecting to home page");
  return NextResponse.redirect(`${origin}`);
}
