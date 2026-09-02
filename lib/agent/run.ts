import { db } from "@/lib/db";
import { callLLM, LLM_ENABLED } from "@/lib/llm";
import {
  getToolSchemasForToolkits,
  executeToolCall,
} from "@/lib/composio/client";
import { emitRunEvent } from "@/lib/events";
import { getUserMemoryContext } from "@/lib/memory";

import type { OutcomePlan } from "./plan";

const MAX_ITERATIONS = 8;
const MAX_TOOL_RESULT_LENGTH = 4000;

const RUN_SYSTEM_PROMPT = `
Tu es Kloyya, un agent qui exécute des outcomes pour un utilisateur professionnel
en utilisant les outils mis à ta disposition.

Tu as déjà un plan approuvé par l'utilisateur.

Règles :
- Suis le plan approuvé.
- Utilise les outils disponibles lorsque cela est nécessaire.
- N'invente jamais le résultat d'une action.
- Si un outil échoue, prends-le en compte et continue seulement si cela reste possible.
- Lorsque tu as terminé, réponds avec un résumé clair et actionnable.
- Réponds en français.
- Ne répète pas inutilement le plan mot pour mot.
`;

type ToolResult = {
  role: "tool";
  content: string;
  tool_call_id: string;
};

export async function executeOutcome(outcomeId: string) {
  const outcome = await db.outcome.findUnique({
    where: {
      id: outcomeId,
    },
  });

  if (!outcome) {
    throw new Error("Outcome introuvable");
  }

  const plan = outcome.planJson as OutcomePlan | null;

  const toolkitSlugs = Array.from(
    new Set(
      (plan?.steps ?? [])
        .map((step) => step.toolkitSlug)
        .filter(
          (slug): slug is string =>
            typeof slug === "string" && slug.length > 0
        )
    )
  );

  await db.outcome.update({
    where: {
      id: outcomeId,
    },
    data: {
      status: "running",
      error: null,
    },
  });

  emitRunEvent(outcomeId, {
    type: "status",
    status: "running",
  });

  try {
    if (!LLM_ENABLED) {
      await runDemo(outcomeId, plan);
      return;
    }

    const tools = await getToolSchemasForToolkits(toolkitSlugs);

    const memoryContext = await getUserMemoryContext(
      outcome.userId
    );

    const planText =
      plan?.steps?.length
        ? plan.steps
            .map(
              (step, index) =>
                `${index + 1}. ${step.label}`
            )
            .join("\n")
        : "Aucun plan détaillé disponible.";

    const messages: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [
      {
        role: "user",
        content:
          `Demande initiale : "${outcome.prompt}"\n\n` +
          `Plan approuvé :\n${planText}\n\n` +
          `Mémoire utilisateur :\n${memoryContext || "Aucune mémoire disponible."}`,
      },
    ];

    let stepIndex = 0;
    let finalText = "";

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const response = await callLLM({
        system: RUN_SYSTEM_PROMPT,
        messages,
        tools: tools as any,
        maxTokens: 1536,
      });

      const assistantContent =
        typeof response.text === "string"
          ? response.text
          : "";

      messages.push({
        role: "assistant",
        content: assistantContent,
      });

      if (!response.toolCalls?.length) {
        finalText =
          assistantContent ||
          "L'agent a terminé sans produire de résumé.";

        break;
      }

      const toolResults: ToolResult[] = [];

      for (const use of response.toolCalls) {
        stepIndex += 1;

        const step = await db.runStep.create({
          data: {
            outcomeId,
            index: stepIndex,
            label: describeToolCall(
              use.name,
              use.input
            ),
            toolkitSlug:
              extractToolkitSlug(use.name),
            action: use.name,
            input: toJsonValue(use.input),
            status: "running",
            startedAt: new Date(),
          },
        });

        emitRunEvent(outcomeId, {
          type: "step",
          step,
        });

        try {
          const result = await executeToolCall({
  userId: outcome.userId,
  toolName: use.name,
  toolInput: use.input,
});

          const output =
            result?.data ?? {
              success: true,
            };

          const updated = await db.runStep.update({
            where: {
              id: step.id,
            },
            data: {
              status: "succeeded",
              output: output as any,
              finishedAt: new Date(),
            },
          });

          emitRunEvent(outcomeId, {
            type: "step",
            step: updated,
          });

          toolResults.push({
            role: "tool",
            content: safeStringify(
              output,
              MAX_TOOL_RESULT_LENGTH
            ),
            tool_call_id: use.id,
          });
        } catch (err: unknown) {
          const message = getErrorMessage(err);

          const updated = await db.runStep.update({
            where: {
              id: step.id,
            },
            data: {
              status: "failed",
              output: {
                error: message,
              },
              finishedAt: new Date(),
            },
          });

          emitRunEvent(outcomeId, {
            type: "step",
            step: updated,
          });

          toolResults.push({
            role: "tool",
            content: `Erreur lors de l'exécution de ${use.name}: ${message}`,
            tool_call_id: use.id,
          });
        }
      }

      const toolContent = toolResults
        .map(
          (result) =>
            `${result.tool_call_id}: ${result.content}`
        )
        .join("\n\n");

      messages.push({
        role: "user",
        content:
          `[Résultats des outils]\n${toolContent}`,
      });
    }

    if (!finalText) {
      finalText =
        "Kloyya a atteint la limite d'étapes sans pouvoir conclure formellement l'outcome.";
    }

    await db.outcome.update({
      where: {
        id: outcomeId,
      },
      data: {
        status: "completed",
        resultSummary: finalText,
        error: null,
      },
    });

    emitRunEvent(outcomeId, {
      type: "done",
      status: "completed",
      summary: finalText,
    });
  } catch (err: unknown) {
    const message = getErrorMessage(err);

    await db.outcome.update({
      where: {
        id: outcomeId,
      },
      data: {
        status: "failed",
        error: message,
      },
    });

    emitRunEvent(outcomeId, {
      type: "done",
      status: "failed",
      error: message,
    });
  }
}

function describeToolCall(
  name: string,
  input: unknown
) {
  const data =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const short =
    data.query ??
    data.instruction ??
    data.text ??
    data.message;

  if (
    typeof short === "string" &&
    short.trim().length > 0
  ) {
    return `${name} — ${short.slice(0, 80)}`;
  }

  return name;
}

function extractToolkitSlug(name: string) {
  const separatorIndex = name.indexOf("_");

  if (separatorIndex <= 0) {
    return null;
  }

  return name.slice(0, separatorIndex);
}

function safeStringify(
  value: unknown,
  maxLength: number
) {
  try {
    const serialized = JSON.stringify(value);

    if (!serialized) {
      return String(value);
    }

    return serialized.slice(0, maxLength);
  } catch {
    return String(value).slice(0, maxLength);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message: unknown }).message
    );
  }

  return String(error);
}
function toJsonValue(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}
async function runDemo(
  outcomeId: string,
  plan: OutcomePlan | null
) {
  const steps =
    plan?.steps?.length
      ? plan.steps
      : [
          {
            label: "Analyser la demande",
            toolkitSlug: null,
          },
          {
            label: "Produire une réponse",
            toolkitSlug: null,
          },
        ];

  for (let index = 0; index < steps.length; index++) {
    const currentStep = steps[index];

    const step = await db.runStep.create({
      data: {
        outcomeId,
        index: index + 1,
        label: currentStep.label,
        toolkitSlug:
          currentStep.toolkitSlug ?? null,
        action: currentStep.toolkitSlug
          ? `${currentStep.toolkitSlug}_act`
          : null,
        status: "running",
        startedAt: new Date(),
      },
    });

    emitRunEvent(outcomeId, {
      type: "step",
      step,
    });

    await new Promise<void>((resolve) => {
      setTimeout(
        resolve,
        700 + Math.random() * 900
      );
    });

    const updated = await db.runStep.update({
      where: {
        id: step.id,
      },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        output: {
          demo: true,
          note:
            "Étape simulée — connectez les clés API nécessaires pour une exécution réelle.",
        },
      },
    });

    emitRunEvent(outcomeId, {
      type: "step",
      step: updated,
    });
  }

  const summary =
    "Voici un résumé simulé de l'outcome (mode demo, aucune clé API configurée). " +
    "Connectez ANTHROPIC_API_KEY ou PERPLEXITY_API_KEY pour le raisonnement réel " +
    "et COMPOSIO_API_KEY pour exécuter de vraies actions.";

  await db.outcome.update({
    where: {
      id: outcomeId,
    },
    data: {
      status: "completed",
      resultSummary: summary,
      error: null,
    },
  });

  emitRunEvent(outcomeId, {
    type: "done",
    status: "completed",
    summary,
  });
}
