import "server-only";
import Stripe from "stripe";
import type { Order } from "../menu/types";
import { siteUrl } from "../supabase/env";

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export const mpEnabled = () => !!process.env.MP_ACCESS_TOKEN;

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!stripeEnabled()) return null;
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return stripe;
}

/** Sesión de Stripe Checkout (tarjeta + Apple Pay / Google Pay según el dashboard). Importes en centavos MXN. */
export async function stripeCheckout(o: Order): Promise<string | null> {
  const s = getStripe(); if (!s) return null;
  const base = siteUrl();
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = o.items.map((l) => ({
    quantity: l.qty,
    price_data: { currency: "mxn", unit_amount: Math.round(l.price * 100), product_data: { name: l.name[o.lang] || l.name.es, description: (l.detail[o.lang] || l.detail.es) || undefined } },
  }));
  if (o.tip > 0) line_items.push({ quantity: 1, price_data: { currency: "mxn", unit_amount: Math.round(o.tip * 100), product_data: { name: o.lang === "en" ? "Tip" : "Propina" } } });
  const session = await s.checkout.sessions.create({
    mode: "payment",
    line_items,
    locale: o.lang === "en" ? "en" : "es-419",
    success_url: `${base}/pedido/${o.code}?t=${o.token}&paid=1`,
    cancel_url: `${base}/?cancel=1&code=${o.code}`,
    metadata: { code: o.code, order_id: o.id },
    // un pago abandonado caduca en 30 min (mínimo de Stripe) y el aviso "expired" cancela el pedido
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    client_reference_id: o.id,
  });
  return session.url ?? null;
}

/** Preferencia de Mercado Pago Checkout Pro. */
export async function mpCheckout(o: Order): Promise<string | null> {
  const token = process.env.MP_ACCESS_TOKEN; if (!token) return null;
  const base = siteUrl();
  const items = o.items.map((l) => ({ id: l.ref, title: l.name[o.lang] || l.name.es, description: (l.detail[o.lang] || l.detail.es) || undefined, quantity: l.qty, currency_id: "MXN", unit_price: l.price }));
  if (o.tip > 0) items.push({ id: "tip", title: o.lang === "en" ? "Tip" : "Propina", description: undefined, quantity: 1, currency_id: "MXN", unit_price: o.tip });
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items, external_reference: o.id, back_urls: { success: `${base}/pedido/${o.code}?t=${o.token}&paid=1`, failure: `${base}/?cancel=1&code=${o.code}`, pending: `${base}/pedido/${o.code}?t=${o.token}` }, auto_return: "approved", expires: true, expiration_date_to: new Date(Date.now() + 30 * 60e3).toISOString(), notification_url: `${base}/api/mp/webhook`, statement_descriptor: "KOI TEA" }),
  });
  if (!r.ok) { console.error("mercadopago", r.status, await r.text()); return null; }
  const j = (await r.json()) as { init_point?: string };
  return j.init_point ?? null;
}
