import { NextResponse } from "next/server";
import { getOrder, patchOrder } from "@/lib/orders/repo";
import { notifyTeam } from "@/lib/orders/whatsapp";
import { siteUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mercado Pago avisa de cada pago; consultamos el pago y, si está aprobado, marcamos el pedido como pagado. */
export async function POST(req: Request) {
  const token = process.env.MP_ACCESS_TOKEN; if (!token) return NextResponse.json({ ok: false }, { status: 503 });
  const url = new URL(req.url);
  let body: { type?: string; data?: { id?: string } } = {};
  try { body = await req.json(); } catch { /* algunos avisos llegan solo por query */ }
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");
  if (type !== "payment" || !id) return NextResponse.json({ ok: true });
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return NextResponse.json({ ok: false }, { status: 200 });
  const p = (await r.json()) as { status?: string; external_reference?: string };
  if (p.status === "approved" && p.external_reference) {
    const o = await patchOrder(p.external_reference, { paid: true, paymentRef: `mp_${id}` });
    if (o) { const full = await getOrder(o.code); if (full) notifyTeam(full, `${siteUrl()}/pedido/${o.code}`).catch(() => undefined); }
  }
  return NextResponse.json({ ok: true });
}
