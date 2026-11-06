import "server-only";
import type { Order, OrderItem, OrderStatus } from "../menu/types";
import type { PublicOrder } from "./types";
import { supabaseAdmin } from "../supabase/server";
import { randomCode, formatCode } from "./code";
import { notifyCustomerReady } from "./whatsapp";

type Row = Record<string, unknown>;

/** Respaldo en memoria cuando no hay base de datos (dura lo que dure el proceso del servidor). */
const mem = new Map<string, Order>();

function rowToOrder(r: Row): Order {
  return {
    id: String(r.id), code: String(r.code), status: Number(r.status) as OrderStatus, type: (r.type as Order["type"]) ?? "togo",
    table: r.table_no == null ? null : Number(r.table_no), name: String(r.name ?? ""), phone: String(r.phone ?? ""), cc: String(r.cc ?? "52"),
    lang: (r.lang as Order["lang"]) ?? "es", items: (r.items as OrderItem[]) ?? [], subtotal: Number(r.subtotal ?? 0), tip: Number(r.tip ?? 0), total: Number(r.total ?? 0),
    pm: (r.pm as Order["pm"]) ?? "bar", paid: !!r.paid, createdAt: String(r.created_at), updatedAt: String(r.updated_at ?? r.created_at),
  };
}

export function toPublic(o: Order): PublicOrder {
  return { code: o.code, status: o.status, type: o.type, table: o.table, name: o.name, items: o.items, subtotal: o.subtotal, tip: o.tip, total: o.total, paid: o.paid, pm: o.pm, lang: o.lang, phoneTail: o.phone ? o.phone.slice(-4) : null, cc: o.cc, createdAt: o.createdAt, updatedAt: o.updatedAt };
}

export const ordersLive = () => !!supabaseAdmin();

export async function createOrder(o: Omit<Order, "id" | "code" | "createdAt" | "updatedAt" | "status">): Promise<Order> {
  const sb = supabaseAdmin();
  if (!sb) {
    const now = new Date().toISOString();
    const order: Order = { ...o, id: crypto.randomUUID(), code: randomCode(), status: 0, createdAt: now, updatedAt: now };
    mem.set(order.code, order);
    return order;
  }
  const seq = await sb.rpc("next_order_code");
  const code = typeof seq.data === "number" ? formatCode(seq.data) : typeof seq.data === "string" ? seq.data : randomCode();
  const row = { code, status: 0, type: o.type, table_no: o.table, name: o.name, phone: o.phone, cc: o.cc, lang: o.lang, items: o.items, subtotal: o.subtotal, tip: o.tip, total: o.total, pm: o.pm, paid: o.paid };
  const { data, error } = await sb.from("orders").insert(row).select("*").single();
  if (error) throw error;
  return rowToOrder(data as Row);
}

export async function getOrder(code: string): Promise<Order | null> {
  const sb = supabaseAdmin();
  if (!sb) return mem.get(code) ?? null;
  const { data, error } = await sb.from("orders").select("*").eq("code", code).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) { console.error(error); return null; }
  return data ? rowToOrder(data as Row) : null;
}

export async function patchOrder(code: string, patch: Partial<Pick<Order, "status" | "paid">> & { paymentRef?: string }): Promise<Order | null> {
  const sb = supabaseAdmin();
  if (!sb) { const o = mem.get(code); if (!o) return null; Object.assign(o, { status: patch.status ?? o.status, paid: patch.paid ?? o.paid, updatedAt: new Date().toISOString() }); return o; }
  const row: Row = { updated_at: new Date().toISOString() };
  if (patch.status != null) row.status = patch.status;
  if (patch.paid != null) row.paid = patch.paid;
  if (patch.paymentRef) row.payment_ref = patch.paymentRef;
  const { data, error } = await sb.from("orders").update(row).eq("code", code).order("created_at", { ascending: false }).limit(1).select("*").maybeSingle();
  if (error) { console.error(error); return null; }
  return data ? rowToOrder(data as Row) : null;
}

/** Cambia el estado y, al marcar "listo", avisa al cliente por WhatsApp si dejó su número. */
export async function setOrderStatus(code: string, status: OrderStatus): Promise<Order | null> {
  const o = await patchOrder(code, { status });
  if (o && status === 2 && o.phone) notifyCustomerReady(o.cc, o.phone, o.code, o.lang).catch(() => undefined);
  return o;
}
