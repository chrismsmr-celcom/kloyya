"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/loading-dots";
import Link from "next/link";

type Outcome = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  resultSummary: string | null;
};

export default function OutcomesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
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
    const res = await fetch("/api/outcomes");
    if (res.ok) {
      const data = await res.json();
      setOutcomes(data.outcomes);
    }
    setLoading(false);
  }

  const statusTone: Record<string, any> = {
    completed: "success",
    failed: "danger",
    running: "accent",
    planning: "neutral",
    awaiting_approval: "warning",
  };

  if (authChecking || loading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        Chargement<LoadingDots />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl italic text-ink">Tes outcomes</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outcomes.map((o) => (
          <Link key={o.id} href={`/outcomes/${o.id}`}>
            <Card className="h-full p-5 transition-all hover:border-accent/30 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 font-medium text-ink">{o.title}</h3>
                <Badge tone={statusTone[o.status] || "neutral"}>{o.status}</Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-ink-soft">
                {o.resultSummary || "En cours..."}
              </p>
              <p className="mt-3 text-xs text-ink-faint">
                {new Date(o.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </Card>
          </Link>
        ))}
      </div>
      {outcomes.length === 0 && (
        <Card className="p-12 text-center text-ink-muted">
          Aucune outcome. Retourne au dashboard pour en créer une.
        </Card>
      )}
    </div>
  );
}
