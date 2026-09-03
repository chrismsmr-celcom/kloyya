import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },

        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({
              name,
              value,
              ...(options as Parameters<
                typeof cookieStore.set
              >[0] extends infer T
                ? T
                : never),
            });
          } catch {
            // Les Server Components ne peuvent pas toujours écrire les cookies.
          }
        },

        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({
              name,
              value: "",
              ...(options as Parameters<
                typeof cookieStore.set
              >[0] extends infer T
                ? T
                : never),
            });
          } catch {
            // Ignoré côté Server Component.
          }
        },
      },
    }
  );
}
