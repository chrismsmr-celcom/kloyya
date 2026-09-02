import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { executeOutcome } from "@/lib/agent/run";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const outcome = await db.outcome.findFirst({ where: { id: params.id, userId: user.id } });
  if (!outcome) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (outcome.status !== "awaiting_approval") {
    return NextResponse.json({ error: "Cette outcome n'est pas en attente d'approbation" }, { status: 409 });
  }

  // Fire-and-forget : la progression est diffusee via l'endpoint SSE.
  // Sur Vercel, une route serverless "sans attendre le retour" peut etre
  // coupee net a la fin de la requete HTTP : pour un usage production a
  // fort volume, deporter executeOutcome() vers une queue (ex: QStash,
  // Inngest, Trigger.dev) plutot que de l'executer inline ici.
  executeOutcome(outcome.id).catch((err) => console.error("[run] fatal:", err));

  return NextResponse.json({ ok: true });
}
