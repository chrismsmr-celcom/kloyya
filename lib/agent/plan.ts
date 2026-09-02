import { callLLM, ANTHROPIC_ENABLED } from "@/lib/llm";
import { getToolkit } from "@/lib/composio/registry";
import { getUserMemoryContext } from "@/lib/memory";

export interface PlanStep {
  label: string;
  toolkitSlug: string | null;
}

export interface OutcomePlan {
  title: string;
  summary: string;
  steps: PlanStep[];
  clarifyingQuestion: string | null;
}

const PLAN_SYSTEM_PROMPT = `Tu es le planificateur de Kloyya, un assistant qui accomplit des "outcomes"
pour des utilisateurs professionnels en s'appuyant sur les outils connectés.

À partir de la demande de l'utilisateur et de la liste des outils connectés,
produis un plan court et concret. Réponds UNIQUEMENT avec un objet JSON de
cette forme, sans texte autour :

{
  "title": "titre court de l'outcome (5-8 mots)",
  "summary": "une phrase qui explique ce que Kloyya va faire",
  "steps": [{ "label": "étape en langage naturel", "toolkitSlug": "slug ou null" }],
  "clarifyingQuestion": "une question à poser avant de lancer l'exécution, ou null si la demande est déjà assez précise"
}

Le plan doit avoir entre 2 et 6 étapes. Utilise uniquement les slugs d'outils
fournis dans la liste des outils connectés ; mets "toolkitSlug": null pour une
étape de raisonnement pur.`;

export async function generatePlan(opts: {
  prompt: string;
  connectedToolkitSlugs: string[];
  userId: string; // ← AJOUT
}): Promise<OutcomePlan> {
  const toolsList = opts.connectedToolkitSlugs
    .map((slug) => `- ${slug} (${getToolkit(slug)?.name ?? slug})`)
    .join("\n") || "(aucun outil connecté)";

  const memoryContext = await getUserMemoryContext(opts.userId); 

  if (!LLM_ENABLED) return demoPlan(opts.prompt, opts.connectedToolkitSlugs);

  const response = await callLLM({
    system: `${PLAN_SYSTEM_PROMPT}\n\n${memoryContext}`, 
    messages: [
      {
        role: "user",
        content: `Demande : "${opts.prompt}"\n\nOutils connectés :\n${toolsList}`,
      },
    ],
    maxTokens: 1024,
  });

  const text = response.text;

  try {
    const parsed = JSON.parse(extractJson(text));
    return normalizePlan(parsed);
  } catch (err) {
    console.error("[plan] JSON parse failed, falling back to demo plan:", err, text);
    return demoPlan(opts.prompt, opts.connectedToolkitSlugs);
  }
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Pas de JSON trouvé");
  return text.slice(start, end + 1);
}

function normalizePlan(raw: any): OutcomePlan {
  return {
    title: String(raw.title ?? "Nouvelle outcome"),
    summary: String(raw.summary ?? ""),
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((s: any) => ({
          label: String(s.label ?? ""),
          toolkitSlug: s.toolkitSlug ?? null,
        }))
      : [],
    clarifyingQuestion: raw.clarifyingQuestion ?? null,
  };
}

function demoPlan(prompt: string, toolkitSlugs: string[]): OutcomePlan {
  const primary = toolkitSlugs[0] ?? null;
  const secondary = toolkitSlugs[1] ?? null;
  return {
    title: prompt.length > 60 ? prompt.slice(0, 57) + "..." : prompt,
    summary: `Kloyya va rassembler l'information nécessaire${primary ? ` via ${getToolkit(primary)?.name ?? primary}` : ""} puis proposer une décision.`,
    steps: [
      { label: "Comprendre le contexte et les contraintes de la demande", toolkitSlug: null },
      ...(primary ? [{ label: `Rechercher l'information pertinente dans ${getToolkit(primary)?.name ?? primary}`, toolkitSlug: primary }] : []),
      ...(secondary ? [{ label: `Croiser avec ${getToolkit(secondary)?.name ?? secondary}`, toolkitSlug: secondary }] : []),
      { label: "Synthétiser une recommandation claire", toolkitSlug: null },
    ],
    clarifyingQuestion: toolkitSlugs.length === 0
      ? "Aucun outil n'est encore connecté : veux-tu continuer avec un raisonnement seul, ou connecter un outil d'abord ?"
      : null,
  };
}