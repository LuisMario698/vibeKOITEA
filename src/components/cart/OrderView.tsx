"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { usePrefs } from "@/lib/store/prefs";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { useMenu } from "@/components/menu/MenuContext";
import { formatPrice } from "@/lib/money";
import { L, drinkById, merchById, optsDesc, toppingById } from "@/lib/menu/helpers";
import type { CartLine, OrderItem, PayMethod } from "@/lib/menu/types";
import type { PublicOrder } from "@/lib/orders/types";
import { tint } from "@/lib/color";
import CupMini from "@/components/menu/CupMini";
import MerchArt from "@/components/menu/MerchArt";
import Tracker from "./Tracker";

export const WA_ICON = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.2c-4.9 0-8.8 3.5-8.8 7.9 0 2.3 1.1 4.4 2.9 5.8l-.7 3.7 3.9-2.1c.9.3 1.8.4 2.7.4 4.9 0 8.8-3.5 8.8-7.9S16.9 3.2 12 3.2z" /></svg>;

/** Sondea el estado del pedido mientras está en curso (cada 5 s; cada 20 s al estar listo). */
export function useOrderPoll(code: string | null, live: boolean, initial: PublicOrder | null) {
  const [order, setOrder] = useState<PublicOrder | null>(initial);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!code || !live) return;
    let alive = true, timer = 0;
    const tick = async () => {
      try {
        const r = await fetch(`/api/orders/${code}`, { cache: "no-store" });
        if (!alive) return;
        if (r.status === 404) { setMissing(true); return; }
        const j = (await r.json()) as { ok: boolean; order?: PublicOrder };
        if (j.ok && j.order) { setOrder(j.order); setMissing(false); if (j.order.status >= 3 || j.order.status === 9) return; }
      } catch { /* reintenta */ }
      timer = window.setTimeout(tick, order && order.status >= 2 ? 20000 : 5000);
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, live]);
  return { order, missing };
}

export function linesToItems(menu: ReturnType<typeof useMenu>, lines: CartLine[]): OrderItem[] {
  return lines.map((l) => {
    if (l.kind === "drink") { const d = drinkById(menu, l.ref); return { kind: "drink", ref: l.ref, name: d?.name ?? { es: l.ref, en: l.ref }, detail: l.opts ? { es: optsDesc(menu, l.opts, "es"), en: optsDesc(menu, l.opts, "en") } : { es: "", en: "" }, qty: l.qty, price: l.price }; }
    const m = merchById(menu, l.ref); return { kind: "merch", ref: l.ref, name: m?.name ?? { es: l.ref, en: l.ref }, detail: l.size ? { es: `Talla ${l.size}`, en: `Size ${l.size}` } : { es: "", en: "" }, qty: l.qty, price: l.price };
  });
}

function ItemIcon({ it }: { it: OrderItem }) {
  const menu = useMenu();
  if (it.kind === "drink") { const d = drinkById(menu, it.ref); if (!d) return null; const top = toppingById(menu, d.topping); return <span className="ic" style={{ background: tint(d.kind === "fruit" ? d.c2 ?? d.c1 : d.c1, 0.7) }}><CupMini drink={d} toppingColor={top?.color ?? "#2A1810"} /></span>; }
  const m = merchById(menu, it.ref); if (!m) return null; return <span className="ic" style={{ background: m.bg }}><MerchArt art={m.art} /></span>;
}

export interface OrderViewProps {
  code: string;
  live: boolean;
  initial?: PublicOrder | null;
  /** Copia local (del teléfono que hizo el pedido). */
  local?: { items: OrderItem[]; type: "togo" | "table"; table: number | null; name: string; tip: number; total: number; pm: PayMethod; paid: boolean; phone: string; cc: string; waUrl: string | null; waText: string } | null;
  paidBanner?: boolean;
}

/** Confirmación y seguimiento de un pedido (se usa dentro del flujo y en /pedido/[code]). */
export default function OrderView({ code, live, initial = null, local = null, paidBanner }: OrderViewProps) {
  const { t, lang } = useT(); const menu = useMenu(); const cur = usePrefs((s) => s.cur);
  const showToast = useUI((s) => s.showToast); const setActiveStatus = useCart((s) => s.setActiveStatus);
  const { order, missing } = useOrderPoll(code, live, initial);
  const price = (n: number) => formatPrice(n, cur, menu.settings.rate);
  const pmName: Record<PayMethod, string> = { express: t("express"), card: t("card"), mp: t("mp"), bar: t("bar") };
  useEffect(() => { if (order) setActiveStatus(order.status); }, [order, setActiveStatus]);
  const status = order?.status ?? 0;
  const items = order?.items ?? local?.items ?? [];
  const type = order?.type ?? local?.type ?? "togo", table = order?.table ?? local?.table ?? null, name = order?.name ?? local?.name ?? "";
  const paid = order?.paid ?? local?.paid ?? false, pm = order?.pm ?? local?.pm ?? "bar", total = order?.total ?? local?.total ?? 0;
  const phoneTail = order?.phoneTail ?? (local?.phone ? local.phone.slice(-4) : null), cc = order?.cc ?? local?.cc ?? "52";
  if (missing && !local) return <div className="emptyc"><b>{t("notFound")}</b><span>{t("notFoundH")}</span></div>;
  const copyLink = async () => { try { await navigator.clipboard.writeText(`${location.origin}/pedido/${code}`); showToast(t("linkCopied")); } catch { /* noop */ } };
  const copyText = async () => { if (!local?.waText) return; try { await navigator.clipboard.writeText(local.waText); showToast(t("copied")); } catch { /* noop */ } };
  return (
    <>
      <div className="done-top">
        <svg className="chk" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#E2482B" /><path d="M15 27 l7 7 l15 -16" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} /></svg>
        <b className="dt">{t("done")}</b>
        <span className="lb" style={{ margin: "6px 0 0" }}>{t("code")}</span>
        <span className="code">{code}</span>
        <span className="who">{type === "table" ? `${t("tableN")} ${table}` : t("togo")}{name ? ` · ${name}` : ""}</span>
      </div>
      {paidBanner && <p className="notice info" style={{ textAlign: "center" }}>{t("paidOk")} ✓</p>}
      <Tracker status={status} live={live} />
      {phoneTail && <p className="wanote">{WA_ICON}<span>{t("waWill")} +{cc} ••• ••• {phoneTail}</span></p>}
      <div className={`paid${paid ? " ok" : ""}`}>{paid ? `${t("paidW")} ${pmName[pm]}` : `${t("payAtBar")} · ${price(total)}`}</div>
      {local?.waUrl && (
        <div style={{ margin: "12px 0 4px", display: "grid", gap: 8 }}>
          <a className="wabtn" href={local.waUrl} target="_blank" rel="noopener">{WA_ICON}<span>{t("waSend")}</span></a>
          <p className="hint" style={{ textAlign: "center" }}>{live ? t("waSendLive") : t("waSendH")}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="ghost" onClick={copyText}>{t("copyOrder")}</button>
            {live && <button className="ghost" onClick={copyLink}>{t("shareTrack")}</button>}
          </div>
        </div>
      )}
      {!local?.waUrl && live && <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}><button className="ghost" onClick={copyLink}>{t("shareTrack")}</button></div>}
      <div className="lines ml" style={{ marginTop: 8 }}>
        {items.map((it, i) => (
          <div className="line" key={i}>
            <ItemIcon it={it} />
            <span><b>{it.qty}× {L(it.name, lang)}</b>{it.detail.es && <small>{L(it.detail, lang)}</small>}</span>
            <span className="lp">{price(it.price * it.qty)}</span>
          </div>
        ))}
      </div>
      {live && <p className="pnote" style={{ textAlign: "center", marginTop: 12 }}>{t("trackNote")}</p>}
    </>
  );
}
