import type { OrderItem, OrderType, PayMethod } from "../menu/types";
import { mxn } from "../money";

const PM_ES: Record<PayMethod, string> = { express: "pago exprés", card: "tarjeta", mp: "Mercado Pago", bar: "en barra" };

export interface WaOrder {
  code: string; type: OrderType; table: number | null; name: string; items: OrderItem[]; total: number; tip: number; pm: PayMethod; paid: boolean; phone: string; cc: string;
}

/** Texto del pedido tal como le llega al WhatsApp del equipo (siempre en español). */
export function orderText(o: WaOrder, trackUrl?: string): string {
  const where = (o.type === "table" ? `Mesa ${o.table ?? ""}`.trim() : "Para llevar") + (o.name ? ` · ${o.name}` : "");
  const lines = o.items.map((l) => `${l.qty}× ${l.name.es}${l.detail.es ? ` (${l.detail.es})` : ""}`).join("\n");
  const pay = o.paid ? `✅ Pagado · ${PM_ES[o.pm]}` : `💵 Por cobrar en barra: ${mxn(o.total)}`;
  const tip = o.tip ? ` · propina ${mxn(o.tip)}` : "";
  const wa = o.phone ? `\n📲 Avisarme por WhatsApp: +${o.cc} ${o.phone}` : "";
  const track = trackUrl ? `\n${trackUrl}` : "";
  return `*🧋 Nuevo pedido ${o.code}*\n${where}\n\n${lines}\n\n*Total: ${mxn(o.total)}*${tip}\n${pay}${wa}${track}`;
}

/** Enlace wa.me: si el negocio tiene número configurado va directo; si no, el cliente elige el chat. */
export function waLink(text: string, shopNumber: string): string {
  const digits = shopNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/* ---------- WhatsApp Business (Cloud API): opcional ---------- */
const cfg = () => {
  const token = process.env.WHATSAPP_TOKEN, phoneId = process.env.WHATSAPP_PHONE_ID, team = process.env.WHATSAPP_TEAM_NUMBER;
  return token && phoneId && team ? { token, phoneId, team: team.replace(/\D/g, "") } : null;
};
export const whatsappApiEnabled = () => !!cfg();

async function send(body: Record<string, unknown>) {
  const c = cfg(); if (!c) return false;
  const r = await fetch(`https://graph.facebook.com/v21.0/${c.phoneId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", ...body }) });
  if (!r.ok) console.error("whatsapp send failed", r.status, await r.text());
  return r.ok;
}

/** Manda el pedido al WhatsApp del equipo con tres botones de respuesta (Preparando · Listo · Entregado). */
export async function notifyTeam(o: WaOrder, trackUrl?: string) {
  const c = cfg(); if (!c) return false;
  return send({
    to: c.team, type: "interactive",
    interactive: {
      type: "button",
      body: { text: orderText(o, trackUrl).slice(0, 1024) },
      action: { buttons: [{ type: "reply", reply: { id: `${o.code}:1`, title: "Preparando" } }, { type: "reply", reply: { id: `${o.code}:2`, title: "Listo" } }, { type: "reply", reply: { id: `${o.code}:3`, title: "Entregado" } }] },
    },
  });
}

/** Aviso al cliente cuando su pedido está listo, con una plantilla aprobada por Meta (WHATSAPP_READY_TEMPLATE). */
export async function notifyCustomerReady(cc: string, phone: string, code: string, lang: string) {
  const c = cfg(); const tpl = process.env.WHATSAPP_READY_TEMPLATE; if (!c || !tpl || !phone) return false;
  return send({ to: `${cc}${phone}`.replace(/\D/g, ""), type: "template", template: { name: tpl, language: { code: lang === "en" ? "en_US" : "es_MX" }, components: [{ type: "body", parameters: [{ type: "text", text: code }] }] } });
}
