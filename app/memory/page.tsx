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
  {
    value: "style",
    label: "Style",
    desc: "Ton, longueur, format…",
  },
  {
    value: "preference",
    label: "Préférence",
    desc: "Outils favoris, heures…",
  },
  {
    value: "pattern",
    label: "Pattern",
    desc: "Habitudes déduites par l'agent",
  },
  {
    value: "context",
    label: "Contexte",
    desc: "Entreprise, rôle, projets…",
  },
  {
    value: "feedback",
    label: "Feedback",
    desc: "Ce qui a marché / pas marché",
  },
];

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: "style",
    key: "",
    value: "",
    weight: 1,
  });

  useEffect(() => {
    void fetchMemories();
  }, []);

  async function fetchMemories() {
    try {
      setLoading(true);

      const res = await fetch("/api/memory", {
        cache: "no-store",
      });

      if (!res.ok) {
        setMemories([]);
        return;
      }

      const data = await res.json();

      setMemories(
        Array.isArray(data.memories)
          ? data.memories
          : []
      );
    } catch {
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }

  async function add(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const key = form.key.trim();
    const value = form.value.trim();

    if (!key || !value || saving) {
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: form.category,
          key,
          value,
          weight: form.weight,
          source: "explicit",
        }),
      });

      if (!res.ok) {
        return;
      }

      setForm({
        category: "style",
        key: "",
        value: "",
        weight: 1,
      });

      await fetchMemories();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(
        `/api/memory/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await fetchMemories();
      }
    } catch {
      // Ignore deletion errors in the UI.
    }
  }

  const grouped = memories.reduce<
    Record<string, Memory[]>
  >((acc, memory) => {
    if (!acc[memory.category]) {
      acc[memory.category] = [];
    }

    acc[memory.category].push(memory);

    return acc;
  }, {});

  if (loading) {
    return (
      <div className="py-20 text-center text-ink-muted">
        Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl italic text-ink">
          Mémoire
        </h1>

        <p className="text-ink-muted">
          Plus tu nourris cette mémoire, plus Kloyya
          pense comme toi.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Ajouter une règle
        </h2>

        <form
          onSubmit={add}
          className="mt-4 grid gap-3 sm:grid-cols-4"
        >
          <select
            aria-label="Catégorie"
            className="h-10 rounded-lg border border-paper-border bg-white px-3 text-sm text-ink"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            disabled={saving}
          >
            {categories.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
          </select>

          <Input
            placeholder="Clé (ex: email_tone)"
            value={form.key}
            onChange={(e) =>
              setForm({
                ...form,
                key: e.target.value,
              })
            }
            disabled={saving}
          />

          <Input
            placeholder="Valeur (ex: direct et court)"
            value={form.value}
            onChange={(e) =>
              setForm({
                ...form,
                value: e.target.value,
              })
            }
            disabled={saving}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              saving ||
              !form.key.trim() ||
              !form.value.trim()
            }
          >
            {saving ? "Ajout..." : "Ajouter"}
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        {categories.map((category) => {
          const items =
            grouped[category.value] || [];

          if (!items.length) {
            return null;
          }

          return (
            <section key={category.value}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  {category.label}
                </h3>

                <span className="text-xs text-ink-faint">
                  {category.desc}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((memory) => (
                  <Card
                    key={memory.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-accent">
                        {memory.key}
                      </span>

                      <p className="truncate text-sm text-ink-soft">
                        {memory.value}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">
                        {memory.weight}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          remove(memory.id)
                        }
                      >
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
            Aucune mémoire. Ajoute ta première règle
            ci-dessus.
          </Card>
        )}
      </div>
    </div>
  );
}
