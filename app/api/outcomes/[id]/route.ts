import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const outcome = await db.outcome.findFirst({
    where: { id: params.id, userId: user.id },
    include: { steps: { orderBy: { index: "asc" } } },
  });
  if (!outcome) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ outcome });
}
