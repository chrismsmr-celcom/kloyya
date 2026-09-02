import { db } from "@/lib/db";
import { callLLM, LLM_ENABLED } from "@/lib/llm";
import { getToolSchemasForToolkits, executeToolCall } from "@/lib/composio/client";
import { emitRunEvent } from "@/lib/events";
import { getUserMemoryContext } from "@/lib/memory"; 
import type { OutcomePlan } from "./plan";

const MAX_ITERATIONS = 8;

const RUN_SYSTEM_PROMPT = `Tu es Kloyya, un agent qui exécute des outcomes pour un utilisateur
professionnel en utilisant les outils mis à ta disposition. Tu as déjà un
plan approuvé par l'utilisateur : suis-le, mais adapte-toi si les résultats
des outils changent la situation. Utilise les outils autant que nécessaire.
Quand tu as terminé, réponds avec un résumé clair et actionnable de ce que
tu as trouvé ou fait, en français, sans répéter le plan mot pour mot.`;

export async function executeOutcome(outcomeId: string) {
  const outcome = await db.outcome.findUnique({ where: { id: outcomeId } });
  if (!outcome) throw new Error("Outcome introuvable");

  const plan = outcome.planJson as unknown as OutcomePlan;
  const toolkitSlugs = Array.from(
    new Set((plan?.steps ?? []).map((s) => s.toolkitSlug).filter((s): s is string => !!s))
  );

  await db.outcome.update({ where: { id: outcomeId }, data: { status: "running" } });
  emitRunEvent(outcomeId, { type: "status", status: "running" });

  try {
    if (!LLM_ENABLED) {
      await runDemo(outcomeId, plan);
      return;
    }

    const tools = await getToolSchemasForToolkits(toolkitSlugs);
    const memoryContext = await getUserMemoryContext(outcome.userId); 

    const messages = [
      {
        role: "user" as const,
        content:
          `Demande initiale : "${outcome.prompt}"\n\n` +
          `Plan approuvé :\n${(plan?.steps ?? []).map((s, i) => `${i + 1}. ${s.label}`).join("\n")}\n\n` +
          memoryContext, 
      },
    ];

    let stepIndex = 0;
    let finalText = "";

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await callLLM({
        system: RUN_SYSTEM_PROMPT,
        messages,
        tools: tools as any,
        maxTokens: 1536,
      });
      
      messages.push({ role: "assistant", content: response.text });

      if (response.toolCalls.length === 0) {
        finalText = response.text;
        break;
      }

      const toolResults: any[] = [];
      for (const use of response.toolCalls) {
        stepIndex += 1;
        const step = await db.runStep.create({
          data: {
            outcomeId,
            index: stepIndex,
            label: describeToolCall(use.name, use.input),
            toolkitSlug: use.name.split("_")[0] ?? null,
            action: use.name,
            input: use.input,
            status: "running",
            startedAt: new Date(),
          },
        });
        emitRunEvent(outcomeId, { type: "step", step });

        try {
          const result = await executeToolCall({
            userId: outcome.userId,
            toolName: use.name,
            toolInput: use.input,
          });

          const updated = await db.runStep.update({
            where: { id: step.id },
            data: { status: "succeeded", output: result.data as any, finishedAt: new Date() },
          });
          emitRunEvent(outcomeId, { type: "step", step: updated });

          toolResults.push({
            role: "tool" as const,
            content: JSON.stringify(result.data).slice(0, 4000),
            tool_call_id: use.id,
          });
        } catch (err: any) {
          const updated = await db.runStep.update({
            where: { id: step.id },
            data: { status: "failed", output: { error: String(err?.message ?? err) }, finishedAt: new Date() },
          });
          emitRunEvent(outcomeId, { type: "step", step: updated });

          toolResults.push({
            role: "tool" as const,
            content: `Erreur: ${String(err?.message ?? err)}`,
            tool_call_id: use.id,
          });
        }
      }

      // Ajouter les résultats comme message user
      const toolContent = toolResults.map((r) => `${r.tool_call_id}: ${r.content}`).join("\n\n");
      messages.push({ role: "user", content: `[Résultats des outils]\n${toolContent}` });
    }

    if (!finalText) {
      finalText = "Kloyya a atteint la limite d'étapes pour cette outcome sans conclure formellement.";
    }

    await db.outcome.update({
      where: { id: outcomeId },
      data: { status: "completed", resultSummary: finalText },
    });
    emitRunEvent(outcomeId, { type: "done", status: "completed", summary: finalText });
  } catch (err: any) {
    const message = String(err?.message ?? err);
    await db.outcome.update({ where: { id: outcomeId }, data: { status: "failed", error: message } });
    emitRunEvent(outcomeId, { type: "done", status: "failed", error: message });
  }
}

function describeToolCall(name: string, input: any) {
  const short = input?.query || input?.instruction;
  return short ? `${name} — ${String(short).slice(0, 80)}` : name;
}

async function runDemo(outcomeId: string, plan: OutcomePlan | null) {
  // ... identique à ton code existant ...
  const steps = plan?.steps?.length
    ? plan.steps
    : [{ label: "Analyser la demande", toolkitSlug: null }, { label: "Produire une réponse", toolkitSlug: null }];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const step = await db.runStep.create({
      data: {
        outcomeId,
        index: i + 1,
        label: s.label,
        toolkitSlug: s.toolkitSlug,
        action: s.toolkitSlug ? `${s.toolkitSlug}_act` : null,
        status: "running",
        startedAt: new Date(),
      },
    });
    emitRunEvent(outcomeId, { type: "step", step });

    await new Promise((r) => setTimeout(r, 700 + Math.random() * 900));

    const updated = await db.runStep.update({
      where: { id: step.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        output: { demo: true, note: "Étape simulée — connectez une clé API pour une exécution réelle." },
      },
    });
    emitRunEvent(outcomeId, { type: "step", step: updated });
  }

  const summary =
    "Voici un résumé simulé de l'outcome (mode demo, aucune clé API configurée). " +
    "Connectez ANTHROPIC_API_KEY ou PERPLEXITY_API_KEY pour un raisonnement réel et COMPOSIO_API_KEY pour exécuter de vraies actions.";

  await db.outcome.update({ where: { id: outcome