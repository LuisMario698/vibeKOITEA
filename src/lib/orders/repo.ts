import "server-only";
import type { Order, OrderItem, OrderStatus } from "../menu/types";
import type { PublicOrder } from "./types";
import { supabaseAdmin } from "../supabase/server";
import { randomCode, formatCode } from "./code";
import { notifyCustomerReady } from "./whatsapp";

type Row = Record<string, unknown>;

/** Respaldo en memoria cuando no hay base de datos (dura lo que dure el proceso del servidor). */
const mem = new Map<string, Order>();

/** Secreto corto para el enlace de seguimiento. */
export const newToken = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

function rowToOrder(r: Row): Order {
  return {
    id: String(r.id), code: String(r.code), token: String(r.token ?? ""), status: Number(r.status) as OrderStatus, type: (r.type as Order["type"]) ?? "togo",
    table: r.table_no == null ? null : Number(r.table_no), name: String(r.name ?? ""), phone: String(r.phone ?? ""), cc: String(r.cc ?? "52"),
    lang: (r.lang as Order["lang"]) ?? "es", items: (r.items as OrderItem[]) ?? [], subtotal: Number(r.subtotal ?? 0), tip: Number(r.tip ?? 0), total: Number(r.total ?? 0),
    pm: (r.pm as Order["pm"]) ?? "bar", paid: !!r.paid, createdAt: String(r.created_at), updatedAt: String(r.updated_at ?? r.created_at),
  };
}

export function toPublic(o: Order): PublicOrder {
  return { code: o.code, status: o.status, type: o.type, table: o.table, name: o.name, items: o.items, subtotal: o.subtotal, tip: o.tip, total: o.total, paid: o.paid, pm: o.pm, lang: o.lang, phoneTail: o.phone ? o.phone.slice(-4) : null, cc: o.cc, createdAt: o.createdAt, updatedAt: o.updatedAt };
}

export const ordersLive = () => !!supabaseAdmin();

/** Comparación en tiempo constante para el token del enlace. */
function sameToken(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function createOrder(o: Omit<Order, "id" | "code" | "token" | "createdAt" | "updatedAt" | "status">): Promise<Order> {
  const sb = supabaseAdmin();
  const token = newToken();
  if (!sb) {
    const now = new Date().toISOString();
    let code = randomCode();
    for (let i = 0; i < 900 && mem.has(code); i++) code = randomCode();
    const order: Order = { ...o, id: crypto.randomUUID(), code, token, status: 0, createdAt: now, updatedAt: now };
    mem.set(order.code, order);
    return order;
  }
  const seq = await sb.rpc("next_order_code");
  const code = typeof seq.data === "number" ? formatCode(seq.data) : typeof seq.data === "string" ? seq.data : randomCode();
  const row = { code, token, status: 0, type: o.type, table_no: o.table, name: o.name, phone: o.phone, cc: o.cc, lang: o.lang, items: o.items, subtotal: o.subtotal, tip: o.tip, total: o.total, pm: o.pm, paid: o.paid };
  const { data, error } = await sb.from("orders").insert(row).select("*").single();
  if (error) throw error;
  return rowToOrder(data as Row);
}

/** Pedido por código + token del enlace. Sin el token correcto no se encuentra (los códigos son cortos y se reciclan). */
export async function getOrderForTracking(code: string, token: string): Promise<Order | null> {
  if (!token) return null;
  const sb = supabaseAdmin();
  if (!sb) { const o = mem.get(code); return o && sameToken(o.token, token) ? o : null; }
  const { data, error } = await sb.from("orders").select("*").eq("code", code).eq("token", token).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) { console.error(error); return null; }
  return data ? rowToOrder(data as Row) : null;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sb = supabaseAdmin();
  if (!sb) { for (const o of mem.values()) if (o.id === id) return o; return null; }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) { console.error(error); return null; }
  return data ? rowToOrder(data as Row) : null;
}

/** El pedido más reciente con ese código (para los botones de WhatsApp del equipo, que solo conocen el código). */
export async function getLatestByCode(code: string): Promise<Order | null> {
  const sb = supabaseAdmin();
  if (!sb) return mem.get(code) ?? null;
  const { data, error } = await sb.from("orders").select("*").eq("code", code).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) { console.error(error); return null; }
  return data ? rowToOrder(data as Row) : null;
}

export async function patchOrder(id: string, patch: Partial<Pick<Order, "status" | "paid">> & { paymentRef?: string }): Promise<Order | null> {
  const sb = supabaseAdmin();
  if (!sb) {
    const o = [...mem.values()].find((x) => x.id === id); if (!o) return null;
    Object.assign(o, { status: patch.status ?? o.status, paid: patch.paid ?? o.paid, updatedAt: new Date().toISOString() });
    return o;
  }
  const row: Row = { updated_at: new Date().toISOString() };
  if (patch.status != null) row.status = patch.status;
  if (patch.paid != null) row.paid = patch.paid;
  if (patch.paymentRef) row.payment_ref = patch.paymentRef;
  const { data, error } = await sb.from("orders").update(row).eq("id", id).select("*").maybeSingle();
  if (error) { console.error(error); return null; }
  return data ? rowToOrder(data as Row) : null;
}

/** Cambia el estado y, al marcar "listo", avisa al cliente por WhatsApp si dejó su número. */
export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const before = await getOrderById(id);
  if (!before) return null;
  const o = await patchOrder(id, { status });
  if (o && status === 2 && before.status !== 2 && o.phone) notifyCustomerReady(o.cc, o.phone, o.code, o.lang).catch(() => undefined);
  return o;
}
