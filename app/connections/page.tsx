"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/loading-dots";

type Toolkit = {
  slug: string;
  name: string;
  description: string;
  letter: string;
  color: string;
  category: string;
  connection: { status: string } | null;
};

export default function ConnectionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setAuthChecking(false);
        fetchData();
      }
    });
  }, [router, supabase]);

  async function fetchData() {
    const res = await fetch("/api/connections");
    
    // 🛡️ SÉCURITÉ : Si non autorisé, on redirige immédiatement
    if (res.status === 401) {
      router.push("/login");
      return;
    }

    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }

  async function connect(slug: string) {
    const res = await fetch(`/api/connections/${slug}`, { method: "POST" });
    const data = await res.json();
    if (data.redirectUrl) window.location.href = data.redirectUrl;
    else fetchData();
  }

  if (authChecking || loading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        Chargement<LoadingDots />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl italic text-ink">Outils connectés</h1>
        <p className="text-ink-muted">Lie les outils que Kloyya peut utiliser pour toi.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Card key={t.slug} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: t.color }}
                >
                  {t.letter}
                </span>
                <div>
                  <h3 className="font-medium text-ink">{t.name}</h3>
                  <p className="text-xs text-ink-muted">{t.category}</p>
                </div>
              </div>
              {t.connection?.status === "active" ? (
                <Badge tone="success">Actif</Badge>
              ) : t.connection?.status === "pending" ? (
                <Badge tone="warning">En attente</Badge>
              ) : (
                <Badge tone="neutral">Déconnecté</Badge>
              )}
            </div>
            <p className="mt-3 text-sm text-ink-soft">{t.description}</p>
            <div className="mt-4 flex-1" />
            <Button
              variant={t.connection?.status === "active" ? "outline" : "primary"}
              size="sm"
              className="w-full"
              onClick={() => connect(t.slug)}
            >
              {t.connection?.status === "active" ? "Reconnecter" : "Connecter"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
