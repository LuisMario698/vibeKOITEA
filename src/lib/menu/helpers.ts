import type { CartLine, Drink, DrinkOpts, Lang, Menu, Merch, Topping } from "./types";
import { SWEET } from "./types";

export const L = (v: { es: string; en: string } | undefined, lang: Lang) => (v ? v[lang] || v.es : "");

export function drinkById(menu: Menu, id: string): Drink | undefined {
  return menu.drinks.find((d) => d.id === id);
}
export function toppingById(menu: Menu, id: string): Topping | undefined {
  return menu.toppings.find((t) => t.id === id);
}
export function merchById(menu: Menu, id: string): Merch | undefined {
  return menu.merch.find((m) => m.id === id);
}

export const ICE_SHORT: Record<Lang, string[]> = { es: ["Sin hielo", "Poco", "Normal"], en: ["No ice", "Light", "Regular"] };
export const ICE_LONG: Record<Lang, string[]> = { es: ["Sin hielo", "Poco hielo", "Hielo normal"], en: ["No ice", "Light ice", "Regular ice"] };

/** Descripción corta de las opciones de una bebida: "Tapioca · 50% azúcar · Hielo normal". */
export function optsDesc(menu: Menu, o: DrinkOpts, lang: Lang): string {
  const t = toppingById(menu, o.top);
  return `${t ? L(t.name, lang) : ""} · ${SWEET[o.sweet] ?? "50%"} ${lang === "en" ? "sugar" : "azúcar"} · ${ICE_LONG[lang][o.ice] ?? ICE_LONG[lang][2]}`;
}

export function lineName(menu: Menu, l: CartLine, lang: Lang): string {
  if (l.kind === "drink") return L(drinkById(menu, l.ref)?.name, lang);
  return L(merchById(menu, l.ref)?.name, lang);
}
export function lineDesc(menu: Menu, l: CartLine, lang: Lang): string {
  if (l.kind === "drink" && l.opts) return optsDesc(menu, l.opts, lang);
  if (l.kind === "merch" && l.size) return `${lang === "en" ? "Size" : "Talla"} ${l.size}`;
  return "";
}

export function lineKey(l: Omit<CartLine, "key">): string {
  return l.kind === "drink" && l.opts
    ? `d-${l.ref}-${l.opts.top}-${l.opts.sweet}-${l.opts.ice}`
    : `m-${l.ref}-${l.size ?? ""}`;
}

export function cartTotals(lines: CartLine[], tipPct: number) {
  const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const drinks = lines.filter((l) => l.kind === "drink").reduce((s, l) => s + l.price * l.qty, 0);
  const tip = Math.round((drinks * tipPct) / 100);
  return { sub, tip, total: sub + tip, count: lines.reduce((s, l) => s + l.qty, 0) };
}

/** ¿Está abierto ahora? (hora local de Sonora, UTC-7 todo el año) */
export function isOpenNow(schedule: Menu["settings"]["schedule"], now = new Date()): boolean {
  const local = new Date(now.getTime() + (now.getTimezoneOffset() - 7 * 60) * 60000);
  const day = local.getDay();
  const mins = local.getHours() * 60 + local.getMinutes();
  const s = schedule[day];
  if (!s) return false;
  return mins >= s[0] && mins < s[1];
}
