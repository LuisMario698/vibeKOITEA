import { NextResponse } from "next/server";
import { getOrderById, patchOrder } from "@/lib/orders/repo";
import { notifyTeam } from "@/lib/orders/whatsapp";
import { siteUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mercado Pago avisa de cada pago; consultamos el pago a su API (fuente de verdad) y, si está aprobado, marcamos el pedido como pagado. */
export async function POST(req: Request) {
  const token = process.env.MP_ACCESS_TOKEN; if (!token) return NextResponse.json({ ok: false }, { status: 503 });
  const url = new URL(req.url);
  let body: { type?: string; data?: { id?: string } } = {};
  try { body = await req.json(); } catch { /* algunos avisos llegan solo por query */ }
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (type !== "payment" || !/^\d+$/.test(id)) return NextResponse.json({ ok: true });
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  // Si la consulta falla respondemos con error para que Mercado Pago reintente el aviso.
  if (!r.ok) return NextResponse.json({ ok: false }, { status: 502 });
  const p = (await r.json()) as { status?: string; external_reference?: string };
  const o = p.external_reference ? await getOrderById(p.external_reference) : null;
  if (!o) return NextResponse.json({ ok: true });
  if (p.status === "approved" && !o.paid) {
    const upd = await patchOrder(o.id, { paid: true, paymentRef: `mp_${id}` });
    if (!upd) return NextResponse.json({ ok: false }, { status: 500 });
    await notifyTeam(upd, `${siteUrl()}/pedido/${upd.code}?t=${upd.token}`).catch(() => undefined);
  } else if ((p.status === "rejected" || p.status === "cancelled") && !o.paid && o.status === 0) {
    await patchOrder(o.id, { status: 9 });
  }
  return NextResponse.json({ ok: true });
}
