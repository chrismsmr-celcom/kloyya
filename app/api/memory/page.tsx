"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Memory = {
  id: string;
  category: string;
  key: string;
  value: string;
  weight: number;
  source: string;
};

const categories = [
  { value: "style", label: "Style", desc: "Ton, longueur, format…" },
  { value: "preference", label: "Préférence", desc: "Outils favoris, heures…" },
  { value: "pattern", label: "Pattern", desc: "Habitudes déduites par l'agent" },
  { value: "context", label: "Contexte", desc: "Entreprise, rôle, projets…" },
  { value: "feedback", label: "Feedback", desc: "Ce qui a marché / pas marché" },
];

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "style", key: "", value: "", weight: 1 });

  useEffect(() => {
    fetchMemories();
  }, []);

  async function fetchMemories() {
    const res = await fetch("/api/memory");
    if (res.ok) {
      const data = await res.json();
      setMemories(data.memories);
    }
    setLoading(false);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.key.trim() || !form.value.trim()) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ category: "style", key: "", value: "", weight: 1 });
    fetchMemories();
  }

  async function remove(id: string) {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    fetchMemories();
  }

  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    acc[m.category] = acc[m.category] || [];
    acc[m.category].push(m);
    return acc;
  }, {});

  if (loading) return <div className="py-20 text-center text-ink-muted">Chargement…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl italic text-ink">Mémoire</h1>
        <p className="text-ink-muted">
          Plus tu nourris cette mémoire, plus Kloyya pense comme toi.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Ajouter une règle</h2>
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-4">
          <select
            className="h-10 rounded-lg border border-paper-border bg-white px-3 text-sm text-ink"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Clé (ex: email_tone)"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            className="sm:col-span-1"
          />
          <Input
            placeholder="Valeur (ex: direct et court)"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="sm:col-span-1"
          />
          <Button type="submit" className="w-full">
            Ajouter
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        {categories.map((cat) => {
          const items = grouped[cat.value] || [];
          if (!items.length) return null;
          return (
            <section key={cat.value}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">{cat.label}</h3>
                <span className="text-xs text-ink-faint">{cat.desc}</span>
              </div>
              <div className="space-y-2">
                {items.map((m) => (
                  <Card key={m.id} className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-accent">{m.key}</span>
                      <p className="truncate text-sm text-ink-soft">{m.value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{m.weight}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        {memories.length === 0 && (
          <Card className="p-8 text-center text-ink-muted">
            Aucune mémoire. Ajoute ta première règle ci-dessus.
          </Card>
        )}
      </div>
    </div>
  );
}