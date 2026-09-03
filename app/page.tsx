"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [fetching, setFetching] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setAuthChecking(false);
        fetchOutcomes();
      }
    });
  }, [router, supabase]);

  async function fetchOutcomes() {
    const res = await fetch("/api/outcomes");
    if (res.ok) {
      const data = await res.json();
      setOutcomes(data.outcomes.slice(0, 5));
    }
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    const res = await fetch("/api/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.outcome) router.push(`/outcomes/${data.outcome.id}`);
  }

  const statusTone: Record<string, any> = {
    completed: "success",
    failed: "danger",
    running: "accent",
    planning: "neutral",
    awaiting_approval: "warning",
  };

  if (authChecking || fetching) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        Chargement<LoadingDots />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-3xl italic text-ink">Que veux-tu obtenir aujourd'hui ?</h1>
        <p className="mt-1 text-ink-muted">Décris l'outcome — Kloyya s'occupe du reste.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Textarea
            rows={3}
            placeholder="Ex : Résume mes emails non lus de la semaine et propose des réponses rapides..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !prompt.trim()}>
              {loading ? <>Planification<LoadingDots className="ml-1" /></> : "Créer l'outcome"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Récentes</h2>
          <Link href="/outcomes" className="text-sm text-accent hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {outcomes.map((o) => (
            <Link key={o.id} href={`/outcomes/${o.id}`}>
              <Card className="group p-5 transition-all hover:border-accent/30 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-ink group-hover:text-accent transition-colors line-clamp-1">
                    {o.title}
                  </h3>
                  <Badge tone={statusTone[o.status] || "neutral"}>{o.status}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                  {o.resultSummary || "En cours de traitement..."}
                </p>
              </Card>
            </Link>
          ))}
          {outcomes.length === 0 && (
            <Card className="col-span-full p-8 text-center text-ink-muted">
              Aucune outcome pour l'instant. Commence par en créer une ci-dessus.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
