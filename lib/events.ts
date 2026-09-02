import { EventEmitter } from "events";

/**
 * Bus pub/sub en memoire pour propager la progression d'une run vers l'UI
 * (endpoint SSE /api/outcomes/[id]/events). Suffisant pour une instance
 * unique (dev, petit deploiement). Pour scaler horizontalement sur Vercel
 * avec plusieurs instances serverless, remplacer par un pub/sub partage
 * (ex: Redis / Upstash / Ably) en gardant la meme interface `emitRunEvent`.
 */
const bus = new EventEmitter();
bus.setMaxListeners(0);

export type RunEvent =
  | { type: "status"; status: string }
  | { type: "step"; step: unknown }
  | { type: "message"; text: string }
  | { type: "done"; status: "completed" | "failed"; summary?: string; error?: string };

export function emitRunEvent(outcomeId: string, event: RunEvent) {
  bus.emit(outcomeId, event);
}

export function subscribeToRun(outcomeId: string, listener: (event: RunEvent) => void) {
  bus.on(outcomeId, listener);
  return () => bus.off(outcomeId, listener);
}
