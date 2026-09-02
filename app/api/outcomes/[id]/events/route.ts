import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { subscribeToRun } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) return new Response("unauthenticated", { status: 401 });

  const outcome = await db.outcome.findFirst({ where: { id: params.id, userId: user.id } });
  if (!outcome) return new Response("not found", { status: 404 });

  const encoder = new TextEncoder();
  let unsubscribe: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      send({ type: "status", status: outcome.status });

      unsubscribe = subscribeToRun(params.id, (event) => {
        send(event);
        if (event.type === "done") {
          controller.close();
        }
      });

      // si la run est deja terminee, on ferme tout de suite
      if (outcome.status === "completed" || outcome.status === "failed") {
        send({ type: "done", status: outcome.status, summary: outcome.resultSummary ?? undefined, error: outcome.error ?? undefined });
        controller.close();
      }
    },
    cancel() {
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
