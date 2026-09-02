import { db } from "./db";

export type MemoryCategory = "style" | "preference" | "pattern" | "context" | "feedback";

/**
 * Récupère le bloc mémoire formaté à injecter dans les prompts.
 * Trié par poids décroissant (les habitudes les plus fortes d'abord).
 */
export async function getUserMemoryContext(userId: string): Promise<string> {
  const memories = await db.memoryEntry.findMany({
    where: { userId },
    orderBy: [{ weight: "desc" }, { updatedAt: "desc" }],
    take: 20,
  });

  if (!memories.length) return "";

  const buckets: Record<string, string[]> = {};
  for (const m of memories) {
    buckets[m.category] = buckets[m.category] || [];
    buckets[m.category].push(`${m.key}: ${m.value}`);
  }

  const labels: Record<string, string> = {
    style: "🎨 Style de communication",
    preference: "⚙️ Préférences",
    pattern: "📊 Patterns observés",
    context: "🏢 Contexte métier",
    feedback: "💬 Feedback passé",
  };

  const sections = Object.entries(buckets)
    .filter(([, items]) => items.length)
    .map(([cat, items]) => `\n[${labels[cat] || cat}]\n${items.map((i) => `- ${i}`).join("\n")}`);

  return `=== MÉMOIRE UTILISATEUR ===${sections.join("\n")}\n=== FIN MÉMOIRE ===\n\n`;
}

/** Upsert une entrée mémoire */
export async function addMemoryEntry(
  userId: string,
  category: MemoryCategory,
  key: string,
  value: string,
  opts?: { source?: string; weight?: number }
) {
  return db.memoryEntry.upsert({
    where: { userId_category_key: { userId, category, key } },
    update: {
      value,
      source: opts?.source || "explicit",
      weight: opts?.weight ?? 1,
      updatedAt: new Date(),
    },
    create: {
      userId,
      category,
      key,
      value,
      source: opts?.source || "explicit",
      weight: opts?.weight ?? 1,
    },
  });
}