import { NextResponse } from "next/server";
import { getOrder, toPublic } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[code]">) {
  const { code } = await ctx.params;
  const c = decodeURIComponent(code).toUpperCase();
  if (!isCode(c)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const o = await getOrder(c);
  if (!o) return NextResponse.json({ ok: false, error: "notfound" }, { status: 404 });
  return NextResponse.json({ ok: true, order: toPublic(o) }, { headers: { "Cache-Control": "no-store" } });
}
