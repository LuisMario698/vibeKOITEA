"use client";
import { motion } from "motion/react";
import { useMenu } from "./MenuContext";
import { useT } from "@/lib/i18n/useT";
import { usePrefs } from "@/lib/store/prefs";
import { useUI } from "@/lib/store/ui";
import { formatPrice } from "@/lib/money";
import { tint } from "@/lib/color";
import { L, isOpenNow, toppingById } from "@/lib/menu/helpers";
import type { Drink, Merch } from "@/lib/menu/types";
import CupMini from "./CupMini";
import MerchArt from "./MerchArt";
import { ripple } from "@/lib/fly";

const reveal = { initial: { opacity: 0, y: 18, scale: 0.97 }, whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, margin: "0px 0px -6% 0px" }, transition: { duration: 0.55, ease: [0.22, 0.8, 0.2, 1] as const } };

function usePrice() {
  const menu = useMenu(); const cur = usePrefs((s) => s.cur);
  return (mxn: number) => formatPrice(mxn, cur, menu.settings.rate);
}

/** Tarjeta de una bebida. */
export function DrinkCard({ d }: { d: Drink }) {
  const menu = useMenu(); const { t, lang } = useT(); const price = usePrice(); const openDrink = useUI((s) => s.openDrink);
  const top = toppingById(menu, d.topping);
  const bg = tint(d.kind === "fruit" ? d.c2 ?? d.c1 : d.c1, 0.7);
  return (
    <motion.button {...reveal} className={`card${d.available ? "" : " out"}`} data-drink={d.id} onClick={(e) => { if (!d.available) return; ripple(e.currentTarget, e); openDrink(d.id, { x: e.clientX, y: e.clientY }); }} aria-disabled={!d.available} aria-label={`${L(d.name, lang)}, ${price(d.price)}`}>
      <div className="ph" style={{ background: bg }} data-out={t("soldOut")}>
        {d.featured && <span className="st">{t("star")}</span>}
        <CupMini drink={d} toppingColor={top?.color ?? "#2A1810"} />
      </div>
      <div className="bd">
        <span className="nm">{L(d.name, lang)}</span>
        <span className="pr">{price(d.price)}<span className="pl" aria-hidden="true">+</span></span>
      </div>
    </motion.button>
  );
}

export function FeaturedRail() {
  const menu = useMenu(); const { t, lang } = useT(); const price = usePrice(); const openDrink = useUI((s) => s.openDrink);
  const feats = menu.drinks.filter((d) => d.featured && d.available);
  if (!feats.length) return null;
  return (
    <section aria-labelledby="h-recs">
      <div className="sec" style={{ paddingBottom: 2 }}><h2 id="h-recs"><span>{t("recs")}</span><small>{t("swipe")}</small></h2></div>
      <div className="rail no-scrollbar">
        {feats.map((d) => {
          const top = toppingById(menu, d.topping);
          const bg = `linear-gradient(150deg, ${d.pop}, ${d.pop} 40%, ${d.kind === "fruit" ? d.c1 : d.c2 ?? d.pop})`;
          return (
            <button key={d.id} className="feat" style={{ color: d.ink ?? "#fff", background: bg }} onClick={(e) => { ripple(e.currentTarget, e); openDrink(d.id, { x: e.clientX, y: e.clientY }); }}>
              <span className="tag">{d.id === "koi-tea" ? t("house") : t("star")}</span>
              <span><b>{L(d.name, lang)}</b><span className="pr">{price(d.price)}</span></span>
              <CupMini drink={d} toppingColor={top?.color ?? "#2A1810"} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CategorySections() {
  const menu = useMenu(); const { lang } = useT();
  return (
    <>
      {menu.categories.map((c) => {
        const items = menu.drinks.filter((d) => d.cat === c.id).sort((a, b) => a.sort - b.sort);
        if (!items.length) return null;
        return (
          <section className="sec" id={`sec-${c.id}`} key={c.id} aria-labelledby={`h-${c.id}`}>
            <h2 id={`h-${c.id}`}><span>{L(c.name, lang)}</span><small>{c.sub ? L(c.sub, lang) : items.length}</small></h2>
            <div className="grid2">{items.map((d) => <DrinkCard key={d.id} d={d} />)}</div>
          </section>
        );
      })}
    </>
  );
}

export function MerchCard({ m }: { m: Merch }) {
  const { lang, t } = useT(); const price = usePrice(); const openMerch = useUI((s) => s.openMerch);
  return (
    <motion.button {...reveal} className={`card mc${m.available ? "" : " out"}`} onClick={(e) => { if (!m.available) return; ripple(e.currentTarget, e); openMerch(m.id); }} aria-label={`${L(m.name, lang)}, ${price(m.price)}`}>
      <div className="ph" style={{ background: m.bg }} data-out={t("soldOut")}><span className="mtag">Merch</span><MerchArt art={m.art} /></div>
      <div className="bd"><span className="nm">{L(m.name, lang)}</span><span className="pr">{price(m.price)}<span className="pl" aria-hidden="true">+</span></span></div>
    </motion.button>
  );
}

export function MerchSection() {
  const menu = useMenu(); const { t } = useT();
  const items = menu.merch.filter((m) => m.available).sort((a, b) => a.sort - b.sort);
  if (!items.length) return null;
  return (
    <section className="sec" id="sec-merch" aria-labelledby="h-merch">
      <h2 id="h-merch"><span>{t("merch")}</span><small>{t("merchH")}</small></h2>
      <div className="grid2">{items.map((m) => <MerchCard key={m.id} m={m} />)}</div>
    </section>
  );
}

export function ToppingsSection() {
  const menu = useMenu(); const { t, lang } = useT();
  return (
    <section className="sec" id="sec-tops" aria-labelledby="h-tops">
      <h2 id="h-tops"><span>{t("tops")}</span><small>{t("topsH")}</small></h2>
      <div className="tops">{menu.toppings.filter((x) => x.available).map((x) => <span key={x.id}><i style={{ background: x.color }} />{L(x.name, lang)}</span>)}</div>
      <p className="pnote" style={{ marginTop: 10 }}>{t("topsNote")}</p>
    </section>
  );
}

export function InfoFooter() {
  const menu = useMenu(); const { t, lang } = useT(); const s = menu.settings;
  const open = isOpenNow(s.schedule);
  return (
    <footer className="sec" style={{ paddingBottom: 140 }}>
      <div className="grid gap-4 rounded-[22px] border border-line bg-card p-5 sm:grid-cols-2">
        <div>
          <span className="lb">{t("hours")}</span>
          <p className="font-medium">{s.hours}</p>
          <p className={`mt-1 text-xs font-mono ${open ? "text-good" : "text-muted"}`}>● {open ? t("openNow") : t("closedNow")}</p>
        </div>
        <div>
          <span className="lb">{t("address")}</span>
          <p className="font-medium">{s.address}</p>
          <p className="text-sm text-muted">{s.city}</p>
          <a className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-koi-deep underline-offset-4 hover:underline" href={s.mapsUrl} target="_blank" rel="noopener">{t("map")} ↗</a>
        </div>
        <div>
          <span className="lb">{t("follow")}</span>
          <a className="font-medium underline-offset-4 hover:underline" href={`https://www.instagram.com/${s.instagram}/`} target="_blank" rel="noopener">@{s.instagram}</a>
          <p className="mt-1 text-sm text-muted">{L(s.origin, lang)}</p>
        </div>
        <div className="text-xs text-muted leading-relaxed">
          <p>{t("priceNote")}</p>
          <p className="mt-2">{t("credits")}</p>
        </div>
      </div>
    </footer>
  );
}
