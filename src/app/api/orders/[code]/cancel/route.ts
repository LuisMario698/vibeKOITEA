import { NextResponse } from "next/server";
import { getOrderForTracking, patchOrder } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** El cliente volvió del pago sin pagar: el pedido en línea pendiente se cancela para que no aparezca en el tablero. */
export async function POST(req: Request, ctx: RouteContext<"/api/orders/[code]/cancel">) {
  const { code } = await ctx.params;
  const c = code.toUpperCase();
  let t = "";
  try { t = String(((await req.json()) as { t?: unknown }).t ?? ""); } catch { /* sin cuerpo */ }
  if (!isCode(c) || !/^[a-f0-9]{16}$/.test(t)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const o = await getOrderForTracking(c, t);
  if (!o) return NextResponse.json({ ok: false, error: "notfound" }, { status: 404 });
  if (o.paid || o.pm === "bar" || o.status !== 0) return NextResponse.json({ ok: false, error: "state" }, { status: 409 });
  await patchOrder(o.id, { status: 9 });
  return NextResponse.json({ ok: true });
}
