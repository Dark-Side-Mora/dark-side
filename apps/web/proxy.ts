import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const pathname = requestUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/signup", "/auth/callback"];

  // Check if this is a public route
  const isPublicRoute = publicRoutes.includes(pathname);

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          req.cookies
            .getAll()
            .map((cookie) => ({ name: cookie.name, value: cookie.value })),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is authenticated
  if (session?.user) {
    // If trying to access auth routes, redirect to home
    if (isPublicRoute && pathname !== "/auth/callback") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // User is authenticated, allow access to protected routes
    return res;
  }

  // If user is NOT authenticated
  if (!session?.user) {
    // If trying to access protected route, redirect to login
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
