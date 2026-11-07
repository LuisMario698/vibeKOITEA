import { NextResponse } from "next/server";
import { getOrderForTracking, toPublic } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estado de un pedido para el seguimiento. Requiere el token del enlace (?t=): los códigos son cortos y se reciclan. */
export async function GET(req: Request, ctx: RouteContext<"/api/orders/[code]">) {
  const { code } = await ctx.params;
  const c = code.toUpperCase();
  const t = new URL(req.url).searchParams.get("t") ?? "";
  if (!isCode(c) || !/^[a-f0-9]{16}$/.test(t)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const o = await getOrderForTracking(c, t);
  if (!o) return NextResponse.json({ ok: false, error: "notfound" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: true, order: toPublic(o) }, { headers: { "Cache-Control": "no-store" } });
}
