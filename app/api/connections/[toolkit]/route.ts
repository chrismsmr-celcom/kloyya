import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getToolkit } from "@/lib/composio/registry";
import { initiateToolkitConnection, COMPOSIO_ENABLED } from "@/lib/composio/client";

export async function POST(_req: Request, { params }: { params: { toolkit: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const toolkit = getToolkit(params.toolkit);
  if (!toolkit) return NextResponse.json({ error: "Outil inconnu" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/api/connections/composio/webhook?toolkit=${toolkit.slug}`;

  const { redirectUrl: authUrl, composioConnectionId } = await initiateToolkitConnection({
    userId: user.id,
    toolkitSlug: toolkit.slug,
    redirectUrl,
  });

  await db.connection.upsert({
    where: { userId_toolkitSlug: { userId: user.id, toolkitSlug: toolkit.slug } },
    update: {
      status: COMPOSIO_ENABLED ? "pending" : "active",
      composioConnectionId,
    },
    create: {
      userId: user.id,
      toolkitSlug: toolkit.slug,
      status: COMPOSIO_ENABLED ? "pending" : "active",
      composioConnectionId,
    },
  });

  // Mode demo : pas d'OAuth reel, on considere la connexion active immediatement.
  return NextResponse.json({ redirectUrl: authUrl, demo: !COMPOSIO_ENABLED });
}
