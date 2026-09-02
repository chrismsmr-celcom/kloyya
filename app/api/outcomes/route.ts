import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generatePlan } from "@/lib/agent/plan";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const outcomes = await db.outcome.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ outcomes });
}

const schema = z.object({ prompt: z.string().min(3).max(4000) });

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Decris ce que tu veux obtenir (3 caracteres minimum)" }, { status: 400 });
  }

  const connections = await db.connection.findMany({
    where: { userId: user.id, status: "active" },
    select: { toolkitSlug: true },
  });

  const outcome = await db.outcome.create({
    data: {
      userId: user.id,
      title: parsed.data.prompt.slice(0, 80),
      prompt: parsed.data.prompt,
      status: "planning",
    },
  });

  try {
    const plan = await generatePlan({
  prompt: parsed.data.prompt,
  connectedToolkitSlugs: connections.map((c) => c.toolkitSlug),
  userId: user.id, 
    });
    const updated = await db.outcome.update({
      where: { id: outcome.id },
      data: {
        title: plan.title || outcome.title,
        status: "awaiting_approval",
        planJson: plan as any,
      },
    });

    return NextResponse.json({ outcome: updated });
  } catch (err: any) {
    await db.outcome.update({
      where: { id: outcome.id },
      data: { status: "failed", error: String(err?.message ?? err) },
    });
    return NextResponse.json({ error: "La planification a echoue" }, { status: 500 });
  }
}
