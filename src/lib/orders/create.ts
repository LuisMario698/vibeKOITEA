import "server-only";
import type { CartLine, DrinkOpts, Order, OrderItem } from "../menu/types";
import type { CreateOrderError, CreateOrderInput, CreateOrderResult } from "./types";
import { getMenu } from "../menu/repo";
import { ICE_LONG, drinkById, merchById, toppingById } from "../menu/helpers";
import { SWEET } from "../menu/types";
import { createOrder, ordersLive } from "./repo";
import { orderText, waLink, notifyTeam } from "./whatsapp";
import { mpCheckout, mpEnabled, stripeCheckout, stripeEnabled } from "./payments";
import { siteUrl } from "../supabase/env";

const str = (v: unknown, max = 60) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valida el pedido contra el menú real (precios del servidor, nunca del cliente), lo guarda y prepara el pago o el WhatsApp. */
export async function placeOrder(raw: unknown): Promise<CreateOrderResult | CreateOrderError> {
  const body = (raw ?? {}) as Partial<CreateOrderInput>;
  const menu = await getMenu();
  if (!menu.settings.acceptOrders) return { ok: false, error: "closed" };
  const lines = Array.isArray(body.items) ? (body.items as CartLine[]).slice(0, 30) : [];
  if (!lines.length) return { ok: false, error: "invalid" };
  const lang = body.lang === "en" ? "en" : "es";
  const items: OrderItem[] = [];
  let subtotal = 0, drinksTotal = 0;
  for (const l of lines) {
    const qty = Math.max(1, Math.min(20, Number(l.qty) || 1));
    if (l.kind === "drink") {
      const d = drinkById(menu, String(l.ref)); if (!d || !d.available) return { ok: false, error: "unavailable", message: String(l.ref) };
      const o = (l.opts ?? {}) as Partial<DrinkOpts>;
      const top = toppingById(menu, String(o.top ?? d.topping)) ?? toppingById(menu, d.topping);
      if (!top || !top.available) return { ok: false, error: "unavailable", message: String(o.top) };
      const sweet = Math.max(0, Math.min(SWEET.length - 1, Number(o.sweet ?? 2) | 0)), ice = Math.max(0, Math.min(2, Number(o.ice ?? 2) | 0));
      const price = d.price + top.price;
      const detail = { es: `${top.name.es} · ${SWEET[sweet]} azúcar · ${ICE_LONG.es[ice]}`, en: `${top.name.en} · ${SWEET[sweet]} sugar · ${ICE_LONG.en[ice]}` };
      items.push({ kind: "drink", ref: d.id, name: d.name, detail, qty, price });
      subtotal += price * qty; drinksTotal += price * qty;
    } else {
      const m = merchById(menu, String(l.ref)); if (!m || !m.available) return { ok: false, error: "unavailable", message: String(l.ref) };
      const size = m.sizes ? (m.sizes.includes(String(l.size)) ? String(l.size) : m.sizes[0]) : null;
      items.push({ kind: "merch", ref: m.id, name: m.name, detail: size ? { es: `Talla ${size}`, en: `Size ${size}` } : { es: "", en: "" }, qty, price: m.price });
      subtotal += m.price * qty;
    }
  }
  const tipPct = menu.settings.tips.includes(Number(body.tipPct)) ? Number(body.tipPct) : 0;
  const tip = Math.round((drinksTotal * tipPct) / 100);
  const total = subtotal + tip;
  const type = body.type === "table" ? "table" : "togo";
  const table = type === "table" ? Math.max(1, Math.min(menu.settings.tableCount, Number(body.table) || 1)) : null;
  const phone = str(body.phone, 15).replace(/\D/g, "");
  if (phone && phone.length !== 10) return { ok: false, error: "invalid", message: "phone" };
  const cc = body.cc === "1" ? "1" : "52";
  const pmRaw = String(body.pm ?? "bar");
  const online = (pmRaw === "express" || pmRaw === "card") && stripeEnabled() ? pmRaw : pmRaw === "mp" && mpEnabled() ? "mp" : "bar";
  const pm = online as Order["pm"];

  const order = await createOrder({ type, table, name: str(body.name, 24), phone, cc, lang, items, subtotal, tip, total, pm, paid: false });
  const live = ordersLive();
  const trackUrl = live ? `${siteUrl()}/pedido/${order.code}` : undefined;
  const text = orderText({ ...order }, trackUrl);
  const waUrl = waLink(text, menu.settings.whatsapp);

  let checkoutUrl: string | undefined;
  if (pm === "express" || pm === "card") {
    try { checkoutUrl = (await stripeCheckout(order)) ?? undefined; } catch (e) { console.error("stripe", e); return { ok: false, error: "payment" }; }
    if (!checkoutUrl) return { ok: false, error: "payment" };
  } else if (pm === "mp") {
    try { checkoutUrl = (await mpCheckout(order)) ?? undefined; } catch (e) { console.error("mp", e); return { ok: false, error: "payment" }; }
    if (!checkoutUrl) return { ok: false, error: "payment" };
  } else {
    // pago en barra: el equipo recibe el pedido de inmediato (si la API de WhatsApp está configurada)
    notifyTeam({ ...order }, trackUrl).catch(() => undefined);
  }
  return { ok: true, code: order.code, subtotal, tip, total, live, paid: false, waUrl, waText: text, checkoutUrl, items };
}
