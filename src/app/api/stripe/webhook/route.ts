import { NextResponse } from "next/server";
import { getStripe } from "@/lib/orders/payments";
import { getOrder, patchOrder } from "@/lib/orders/repo";
import { notifyTeam, orderText } from "@/lib/orders/whatsapp";
import { siteUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe avisa cuando el pago se aprueba: el pedido queda pagado y le llega al equipo. */
export async function POST(req: Request) {
  const stripe = getStripe(); const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ ok: false }, { status: 503 });
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();
  let event;
  try { event = stripe.webhooks.constructEvent(raw, sig, secret); } catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const code = session.metadata?.code ?? session.client_reference_id;
    if (code && session.payment_status === "paid") {
      const o = await patchOrder(code, { paid: true, paymentRef: typeof session.payment_intent === "string" ? session.payment_intent : session.id });
      if (o) { const full = await getOrder(code); if (full) notifyTeam(full, `${siteUrl()}/pedido/${code}`).catch(() => undefined); void orderText; }
    }
  }
  return NextResponse.json({ received: true });
}
