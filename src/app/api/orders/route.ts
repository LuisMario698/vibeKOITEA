import { NextResponse } from "next/server";
import { placeOrder } from "@/lib/orders/create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }); }
  try {
    const r = await placeOrder(body);
    return NextResponse.json(r, { status: r.ok ? 200 : r.error === "server" ? 500 : 400 });
  } catch (e) {
    console.error("placeOrder", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
