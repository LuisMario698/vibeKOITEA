import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getLatestByCode, setOrderStatus } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verificación del webhook de Meta. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === expected) return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  return new Response("forbidden", { status: 403 });
}

/** Firma X-Hub-Signature-256 de Meta (HMAC-SHA256 del cuerpo con el App Secret). */
function validSignature(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const got = Buffer.from(header.slice(7), "hex");
  const want = createHmac("sha256", secret).update(raw, "utf8").digest();
  return got.length === want.length && timingSafeEqual(got, want);
}

/** El equipo toca un botón (Preparando · Listo · Entregado) en WhatsApp y el pedido cambia de estado. */
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "WHATSAPP_APP_SECRET no configurado" }, { status: 503 });
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"), secret)) return NextResponse.json({ ok: false }, { status: 401 });
  type Msg = { interactive?: { button_reply?: { id?: string } } };
  type Body = { entry?: Array<{ changes?: Array<{ value?: { messages?: Msg[] } }> }> };
  let body: Body = {};
  try { body = JSON.parse(raw) as Body; } catch { return NextResponse.json({ ok: true }); }
  const ids = (body.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => (c.value?.messages ?? []).map((m) => m.interactive?.button_reply?.id).filter(Boolean))) as string[];
  for (const id of ids) {
    const [code, st] = id.split(":");
    const status = Number(st);
    if (!isCode(code) || ![1, 2, 3].includes(status)) continue;
    const o = await getLatestByCode(code);
    if (o && o.status !== 9) await setOrderStatus(o.id, status as 1 | 2 | 3);
  }
  return NextResponse.json({ ok: true });
}
