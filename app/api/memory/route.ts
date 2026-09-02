import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const memories = await db.memoryEntry.findMany({
    where: { userId: user.id },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json();

  const entry = await db.memoryEntry.upsert({
    where: {
      userId_category_key: {
        userId: user.id,
        category: body.category,
        key: body.key,
      },
    },
    update: {
      value: body.value,
      weight: body.weight ?? 1,
      source: body.source || "explicit",
    },
    create: {
      userId: user.id,
      category: body.category,
      key: body.key,
      value: body.value,
      weight: body.weight ?? 1,
      source: body.source || "explicit",
    },
  });

  return NextResponse.json({ entry });
}