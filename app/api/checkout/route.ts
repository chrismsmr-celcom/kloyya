import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  team: process.env.STRIPE_PRICE_TEAM,
};

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { plan } = await req.json().catch(() => ({ plan: null }));
  const priceId = PRICE_BY_PLAN[plan];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    // Mode demo : pas de Stripe configure, on active le plan directement.
    await db.user.update({ where: { id: user.id }, data: { plan: plan === "team" ? "team" : "pro" } });
    return NextResponse.json({ url: `${appUrl}/welcome`, demo: true });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/welcome`,
    cancel_url: `${appUrl}/plans`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
