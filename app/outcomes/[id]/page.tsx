"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/loading-dots";

type Step = {
  id: string;
  index: number;
  label: string;
  status: string;
  output: any;
  startedAt: string;
  finishedAt: string | null;
};

type Outcome = {
  id: string;
  title: string;
  status: string;
  prompt: string;
  planJson: any;
  resultSummary: string | null;
  error: string | null;
  steps: Step[];
};

export default function OutcomeDetailPage() {
  const { id } = useParams() as { id: string };
  const { status } = useSession();
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [liveSteps, setLiveSteps] = useState<Step[]>([]);
  const [liveStatus, setLiveStatus] = useState<string>("");
  const [running, setRunning] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchOutcome();
  }, [status, id]);

  useEffect(() => {
    return () => {
      sseRef.current?.close();
    };
  }, []);

  async function fetchOutcome() {
    const res = await fetch(`/api/outcomes/${id}`);
    if (!res.ok) return router.push("/outcomes");
    const data = await res.json();
    setOutcome(data.outcome);
    setLiveSteps(data.outcome.steps);
    setLiveStatus(data.outcome.status);
    if (data.outcome.status === "running") subscribeSSE();
  }

  function subscribeSSE() {
    if (sseRef.current) return;
    const es = new EventSource(`/api/outcomes/${id}/events`);
    sseRef.current = es;

    es.onmessage = (msg) => {
      const event = JSON.parse(msg.data);
      if (event.type === "status") setLiveStatus(event.status);
      if (event.type === "step") {
        setLiveSteps((prev) => {
          const exists = prev.find((s) => s.id === event.step.id);
          if (exists) return prev.map((s) => (s.id === event.step.id ? event.step : s));
          return [...prev, event.step].sort((a, b) => a.index - b.index);
        });
      }
      if (event.type === "done") {
        setLiveStatus(event.status);
        es.close();
        sseRef.current = null;
        fetchOutcome();
      }
    };

    es.onerror = () => {
      es.close();
      sseRef.current = null;
    };
  }

  async function approveAndRun() {
    setRunning(true);
    await fetch(`/api/outcomes/${id}/run`, { method: "POST" });
    setLiveStatus("running");
    subscribeSSE();
  }

  const statusTone: Record<string, any> = {
    completed: "success",
    failed: "danger",
    running: "accent",
    planning: "neutral",
    awaiting_approval: "warning",
  };

  if (!outcome) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        Chargement<LoadingDots />
      </div>
    );
  }

  const steps = liveSteps.length ? liveSteps : outcome.steps;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl italic text-ink">{outcome.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{outcome.prompt}</p>
        </div>
        <Badge tone={statusTone[liveStatus] || "neutral"}>{liveStatus}</Badge>
      </div>

      {outcome.planJson && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Plan</h2>
          <ol className="mt-3 space-y-2">
            {outcome.planJson.steps?.map((s: any, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-sunken text-xs font-medium text-ink-muted">
                  {i + 1}
                </span>
                <span className="text-ink-soft">{s.label}</span>
              </li>
            ))}
          </ol>
          {outcome.planJson.clarifyingQuestion && (
            <p className="mt-4 rounded-lg bg-accent-soft p-3 text-sm text-accent">
              {outcome.planJson.clarifyingQuestion}
            </p>
          )}
        </Card>
      )}

      {liveStatus === "awaiting_approval" && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink-soft">
              Le plan est prêt. Lance l'exécution pour que Kloyya agisse dans tes outils.
            </p>
            <Button onClick={approveAndRun} disabled={running}>
              {running ? "Lancement..." : "Exécuter le plan"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Étapes</h2>
        {steps.length === 0 && <Card className="p-6 text-center text-sm text-ink-muted">Aucune étape pour l'instant.</Card>}
        {steps.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{s.label}</span>
              <Badge
                tone={
                  s.status === "succeeded"
                    ? "success"
                    : s.status === "failed"
                    ? "danger"
                    : s.status === "running"
                    ? "accent"
                    : "neutral"
                }
              >
                {s.status}
              </Badge>
            </div>
            {s.output && (
              <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-paper-sunken p-3 text-xs text-ink-soft">
                {JSON.stringify(s.output, null, 2)}
              </pre>
            )}
          </Card>
        ))}
      </div>

      {(liveStatus === "completed" || liveStatus === "failed") && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Résultat</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
            {outcome.resultSummary || outcome.error || "Aucun résumé disponible."}
          </p>
        </Card>
      )}
    </div>
  );
}