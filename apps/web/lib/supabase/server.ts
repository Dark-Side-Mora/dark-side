import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Handle cookie setting errors in middleware
            console.error("Error setting cookie:", error);
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.delete(name);
          } catch (error) {
            console.error("Error removing cookie:", error);
          }
        },
      },
    },
  );
}
