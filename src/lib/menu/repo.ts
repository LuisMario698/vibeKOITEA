import "server-only";
import type { Category, Drink, Menu, Merch, Settings, Topping } from "./types";
import { DEFAULT_SETTINGS, STATIC_MENU } from "./data";
import { supabaseAnon } from "../supabase/env-server";

type Row = Record<string, unknown>;
const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const n = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v ?? d) || d);
const b = (v: unknown, d = true) => (typeof v === "boolean" ? v : d);

const handle = (v: string) => v.trim().replace(/^@+/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/+$/, "");

function mapSettings(r: Row | null): Settings {
  // Pedidos en vivo = hay base de datos. El pago en línea solo se ofrece con ella (el aviso del banco tiene que encontrar el pedido).
  const live = !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const base: Settings = {
    ...DEFAULT_SETTINGS,
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || DEFAULT_SETTINGS.whatsapp,
    instagram: handle(process.env.NEXT_PUBLIC_INSTAGRAM || DEFAULT_SETTINGS.instagram),
    payments: { stripe: live && !!process.env.STRIPE_SECRET_KEY, mp: live && !!process.env.MP_ACCESS_TOKEN },
    live,
  };
  if (!r) return base;
  return {
    ...base,
    rate: n(r.rate, base.rate) || base.rate,
    whatsapp: s(r.whatsapp, base.whatsapp) || base.whatsapp,
    instagram: handle(s(r.instagram, base.instagram)) || base.instagram,
    hours: s(r.hours, base.hours) || base.hours,
    schedule: Array.isArray(r.schedule) ? (r.schedule as Settings["schedule"]) : base.schedule,
    address: s(r.address, base.address) || base.address,
    city: s(r.city, base.city) || base.city,
    mapsUrl: s(r.maps_url, base.mapsUrl) || base.mapsUrl,
    tagline: { es: s(r.tagline_es, base.tagline.es) || base.tagline.es, en: s(r.tagline_en, base.tagline.en) || base.tagline.en },
    origin: { es: s(r.origin_es, base.origin.es) || base.origin.es, en: s(r.origin_en, base.origin.en) || base.origin.en },
    acceptOrders: b(r.accept_orders, true),
    tableCount: n(r.table_count, base.tableCount) || base.tableCount,
    tips: Array.isArray(r.tips) ? (r.tips as number[]) : base.tips,
    promo: s(r.promo_es) ? { es: s(r.promo_es), en: s(r.promo_en) || s(r.promo_es) } : null,
  };
}
const mapCat = (r: Row): Category => ({ id: s(r.id), name: { es: s(r.name_es), en: s(r.name_en) || s(r.name_es) }, sub: s(r.sub_es) ? { es: s(r.sub_es), en: s(r.sub_en) || s(r.sub_es) } : undefined, sort: n(r.sort) });
const mapDrink = (r: Row): Drink => ({ id: s(r.id), cat: s(r.category_id), name: { es: s(r.name_es), en: s(r.name_en) || s(r.name_es) }, desc: { es: s(r.desc_es), en: s(r.desc_en) || s(r.desc_es) }, price: n(r.price_mxn), kind: (s(r.kind, "milk") as Drink["kind"]), c1: s(r.c1, "#C9A27E"), c2: s(r.c2) || undefined, pop: s(r.pop, "#B07D55"), ink: s(r.ink) || undefined, topping: s(r.topping, "tapioca"), featured: b(r.featured, false), available: b(r.available, true), sort: n(r.sort) });
const mapTop = (r: Row): Topping => ({ id: s(r.id), name: { es: s(r.name_es), en: s(r.name_en) || s(r.name_es) }, color: s(r.color, "#2A1810"), type: (s(r.type, "tapioca") as Topping["type"]), price: n(r.price_mxn), available: b(r.available, true), sort: n(r.sort) });
const mapMerch = (r: Row): Merch => ({ id: s(r.id), name: { es: s(r.name_es), en: s(r.name_en) || s(r.name_es) }, desc: { es: s(r.desc_es), en: s(r.desc_en) || s(r.desc_es) }, price: n(r.price_mxn), sizes: Array.isArray(r.sizes) ? (r.sizes as string[]) : null, art: (s(r.art, "teeBlack") as Merch["art"]), bg: s(r.bg, "#E9E2D8"), available: b(r.available, true), sort: n(r.sort) });

/** Menú completo: de Supabase cuando está configurado, si no, los datos estáticos. Nunca falla: ante un error vuelve al respaldo. */
export async function getMenu(): Promise<Menu> {
  const sb = supabaseAnon();
  if (!sb) return { ...STATIC_MENU, settings: mapSettings(null) };
  try {
    const [cats, prods, tops, merch, settings] = await Promise.all([
      sb.from("categories").select("*").order("sort"),
      sb.from("products").select("*").order("sort"),
      sb.from("toppings").select("*").order("sort"),
      sb.from("merch").select("*").order("sort"),
      sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (cats.error || prods.error || tops.error || merch.error) throw cats.error ?? prods.error ?? tops.error ?? merch.error;
    const menu: Menu = {
      categories: (cats.data as Row[]).map(mapCat),
      drinks: (prods.data as Row[]).map(mapDrink),
      toppings: (tops.data as Row[]).map(mapTop),
      merch: (merch.data as Row[]).map(mapMerch),
      settings: mapSettings((settings.data as Row | null) ?? null),
    };
    if (!menu.drinks.length) return { ...STATIC_MENU, settings: menu.settings };
    return menu;
  } catch (e) {
    console.error("getMenu: usando datos estáticos", e);
    return { ...STATIC_MENU, settings: mapSettings(null) };
  }
}
