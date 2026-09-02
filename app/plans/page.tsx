"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "0€",
    desc: "Pour essayer Kloyya.",
    features: ["3 outcomes / mois", "1 outil connecté", "Support par email"],
    cta: "Gratuit",
    current: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: "19€",
    period: "/mois",
    desc: "Pour les freelances et petites équipes.",
    features: ["Outcomes illimités", "5 outils connectés", "Exécution prioritaire", "Support 48h"],
    cta: "Passer Pro",
    current: false,
    highlight: true,
  },
  {
    key: "team",
    name: "Team",
    price: "49€",
    period: "/mois",
    desc: "Pour les équipes qui veulent déléguer à l'agent.",
    features: ["Tout Pro", "Outils illimités", "Membres illimités", "Support prioritaire"],
    cta: "Choisir Team",
    current: false,
  },
];

export default function PlansPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: string) {
    if (!session) return router.push("/login");
    setLoading(plan);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoading(null);
    if (data.url) window.location.href = data.url;
    else if (data.demo) router.push(data.url);
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="font-serif text-3xl italic text-ink">Tarifs</h1>
        <p className="mt-2 text-ink-muted">Choisis la puissance dont tu as besoin.</p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.key}
            className={`relative flex flex-col p-6 ${
              p.highlight
                ? "border-accent/40 bg-white/90 shadow-xl"
                : "bg-white/70"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge tone="accent">Populaire</Badge>
              </div>
            )}
            <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">{p.price}</span>
              {p.period && <span className="text-sm text-ink-muted">{p.period}</span>}
            </div>
            <p className="mt-2 text-sm text-ink-soft">{p.desc}</p>
            <ul className="mt-5 space-y-2">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-ok" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex-1" />
            <Button
              variant={p.highlight ? "primary" : "outline"}
              className="w-full"
              disabled={p.current || !!loading}
              onClick={() => !p.current && checkout(p.key)}
            >
              {loading === p.key ? "Redirection..." : p.current ? "Actuel" : p.cta}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}