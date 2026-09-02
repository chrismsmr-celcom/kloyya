import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listAvailableToolkits } from "@/lib/composio/client";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const [toolkits, connections] = await Promise.all([
    listAvailableToolkits(),
    db.connection.findMany({ where: { userId: user.id } }),
  ]);

  const byToolkit = new Map(connections.map((c) => [c.toolkitSlug, c]));

  const items = toolkits.map((t) => ({
    ...t,
    connection: byToolkit.get(t.slug) ?? null,
  }));

  return NextResponse.json({ items });
}
