import { NextResponse } from "next/server";
import { setOrderStatus } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verificación del webhook de Meta. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  return new Response("forbidden", { status: 403 });
}

/** El equipo toca un botón (Preparando · Listo · Entregado) en WhatsApp y el pedido cambia de estado. */
export async function POST(req: Request) {
  type Msg = { interactive?: { button_reply?: { id?: string } } };
  type Body = { entry?: Array<{ changes?: Array<{ value?: { messages?: Msg[] } }> }> };
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ ok: true }); }
  const ids = (body.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => (c.value?.messages ?? []).map((m) => m.interactive?.button_reply?.id).filter(Boolean))) as string[];
  for (const id of ids) {
    const [code, st] = id.split(":");
    const status = Number(st);
    if (isCode(code) && [1, 2, 3].includes(status)) await setOrderStatus(code, status as 1 | 2 | 3);
  }
  return NextResponse.json({ ok: true });
}
