import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

/**
 * Point de retour apres l'ecran d'autorisation OAuth du fournisseur
 * (redirige par Composio une fois la connexion etablie cote fournisseur).
 * On marque simplement la connexion comme active puis on renvoie
 * l'utilisateur vers l'ecran Connections.
 */
export async function GET(req: Request) {
  const user = await requireUser().catch(() => null);
  const url = new URL(req.url);
  const toolkit = url.searchParams.get("toolkit");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (user && toolkit) {
    await db.connection.updateMany({
      where: { userId: user.id, toolkitSlug: toolkit },
      data: { status: "active" },
    });
  }

  return NextResponse.redirect(`${appUrl}/connections?connected=${toolkit ?? ""}`);
}
