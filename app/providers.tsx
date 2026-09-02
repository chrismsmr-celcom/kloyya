"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext<ReturnType<typeof createBrowserClient> | null>(null);

export const useSupabase = () => useContext(Ctx)!;

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => data.subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <SessionProvider>
      <Ctx.Provider value={supabase}>
        {children}
      </Ctx.Provider>
    </SessionProvider>
  );
}
