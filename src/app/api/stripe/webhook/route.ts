import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/orders/payments";
import { getOrderById, patchOrder } from "@/lib/orders/repo";
import { notifyTeam } from "@/lib/orders/whatsapp";
import { siteUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe avisa cuando el pago se aprueba: el pedido queda pagado y le llega al equipo (una sola vez aunque Stripe reintente). */
export async function POST(req: Request) {
  const stripe = getStripe(); const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ ok: false }, { status: 503 });
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(raw, sig, secret); } catch { return NextResponse.json({ ok: false, error: "signature" }, { status: 400 }); }

  if (!event.type.startsWith("checkout.session.")) return NextResponse.json({ received: true });
  const session = event.data.object as Stripe.Checkout.Session;
  const id = session.metadata?.order_id ?? session.client_reference_id ?? "";
  const o = id ? await getOrderById(id) : null;
  if (!o) return NextResponse.json({ received: true });

  if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && session.payment_status === "paid") {
    if (o.paid) return NextResponse.json({ received: true, duplicate: true });
    const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
    const upd = await patchOrder(o.id, { paid: true, paymentRef: ref });
    if (!upd) return NextResponse.json({ ok: false }, { status: 500 }); // Stripe reintentará
    await notifyTeam(upd, `${siteUrl()}/pedido/${upd.code}?t=${upd.token}`).catch(() => undefined);
  } else if ((event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") && !o.paid && o.status === 0) {
    // pago abandonado o rechazado: el pedido sale del tablero
    await patchOrder(o.id, { status: 9 });
  }
  return NextResponse.json({ received: true });
}
