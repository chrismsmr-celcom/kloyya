"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const SupabaseContext = createContext<
  ReturnType<typeof createClient> | null
>(null);

export function useSupabase() {
  const client = useContext(SupabaseContext);

  if (!client) {
    throw new Error(
      "useSupabase must be used inside Providers"
    );
  }

  return client;
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}
