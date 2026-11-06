"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMenu } from "@/components/menu/MenuContext";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { usePrefs } from "@/lib/store/prefs";
import { useT } from "@/lib/i18n/useT";
import { formatPrice, usdApprox } from "@/lib/money";
import { cartTotals, drinkById, lineDesc, lineName, merchById, toppingById } from "@/lib/menu/helpers";
import type { CartLine, PayMethod } from "@/lib/menu/types";
import type { CreateOrderError, CreateOrderResult } from "@/lib/orders/types";
import { tint } from "@/lib/color";
import KoiMark from "@/components/brand/KoiMark";
import CupMini from "@/components/menu/CupMini";
import MerchArt from "@/components/menu/MerchArt";
import OrderView from "./OrderView";
import { reducedMotion, wait } from "@/lib/utils";

type Step = "cart" | "pay" | "done";
const PAYI: Record<PayMethod, React.ReactNode> = {
  express: <svg viewBox="0 0 24 24" fill="none" stroke="#27211E" strokeWidth="1.8" strokeLinecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /><path d="M19.5 8.5a5 5 0 0 1 0 7M21.5 6.5a8 8 0 0 1 0 11" /></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="#27211E" strokeWidth="1.8" strokeLinecap="round"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19M6 15h4" /></svg>,
  mp: <svg viewBox="0 0 24 24" fill="none" stroke="#27211E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5h15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path d="M5.5 8.5l9-4 2 4" /><circle cx="16.5" cy="14" r="1.2" fill="#27211E" /></svg>,
  bar: <svg viewBox="0 0 24 24" fill="none" stroke="#27211E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1.4 12.2a1.5 1.5 0 0 1-1.5 1.3H8.9a1.5 1.5 0 0 1-1.5-1.3z" /><path d="M5 8h14M13 8l2.5-5.5" /></svg>,
};
const LOCK = <svg viewBox="0 0 16 16" fill="none" stroke="#7A6D64" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></svg>;

function LineIcon({ l }: { l: CartLine }) {
  const menu = useMenu();
  if (l.kind === "drink") { const d = drinkById(menu, l.ref); if (!d) return <span className="ic" />; const top = toppingById(menu, l.opts?.top ?? d.topping); return <span className="ic" style={{ background: tint(d.kind === "fruit" ? d.c2 ?? d.c1 : d.c1, 0.7) }}><CupMini drink={d} toppingColor={top?.color ?? "#2A1810"} /></span>; }
  const m = merchById(menu, l.ref); return <span className="ic" style={{ background: m?.bg }}>{m && <MerchArt art={m.art} />}</span>;
}

/** Carrito → datos y pago → confirmación con seguimiento. En móvil ocupa la pantalla; en escritorio es un panel lateral. */
export default function OrderFlow() {
  const menu = useMenu(); const { t, tn, lang } = useT(); const cur = usePrefs((s) => s.cur);
  const open = useUI((s) => s.orderOpen); const setOpen = useUI((s) => s.setOrderOpen); const showToast = useUI((s) => s.showToast);
  const cart = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [proc, setProc] = useState<null | "loading" | "ok">(null);
  const [err, setErr] = useState<string | null>(null);
  const [waErr, setWaErr] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const waInput = useRef<HTMLInputElement>(null);
  const price = (n: number) => formatPrice(n, cur, menu.settings.rate);
  const totals = cartTotals(cart.lines, cart.tipPct);
  const s = menu.settings;
  const methods = useMemo<PayMethod[]>(() => [...(s.payments.stripe ? (["express", "card"] as PayMethod[]) : []), ...(s.payments.mp ? (["mp"] as PayMethod[]) : []), "bar"], [s.payments.stripe, s.payments.mp]);
  const pm: PayMethod = methods.includes(cart.pm) ? cart.pm : "bar";
  const pmName: Record<PayMethod, string> = { express: t("express"), card: t("card"), mp: t("mp"), bar: t("bar") };
  const pmSub: Record<PayMethod, string> = { express: t("expressS"), card: t("cardS"), mp: t("mpS"), bar: t("barS") };

  useEffect(() => {
    if (!open) { document.body.classList.remove("lock"); return; }
    document.body.classList.add("lock");
    const r = requestAnimationFrame(() => { setErr(null); setProc(null); setStep(!cart.lines.length && cart.active && cart.active.status < 3 ? "done" : "cart"); });
    return () => cancelAnimationFrame(r);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && useUI.getState().orderOpen) setOpen(false); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const pos = (st: Step) => { const o: Step[] = ["cart", "pay", "done"]; const ci = o.indexOf(step), i = o.indexOf(st); return i < ci ? "l" : i === ci ? "c" : "r"; };
  const back = () => { if (step === "pay") setStep("cart"); else setOpen(false); };
  const setQty = (l: CartLine, d: number) => {
    const q = l.qty + d;
    if (q <= 0) { setRemoving(l.key); setTimeout(() => { cart.setQty(l.key, 0); setRemoving(null); }, reducedMotion() ? 0 : 280); return; }
    cart.setQty(l.key, Math.min(20, q));
  };
  const goPay = () => {
    if (!cart.lines.length) return;
    if (cart.phone && cart.phone.length !== 10) { setWaErr(true); waInput.current?.focus(); if (!reducedMotion()) waInput.current?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }], { duration: 320 }); return; }
    setWaErr(false); setStep("pay");
  };
  const confirm = async () => {
    if (!cart.lines.length || proc) return;
    setErr(null); setProc("loading");
    const snapshot = cart.lines.slice();
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: snapshot, type: cart.type, table: cart.table, name: cart.name, phone: cart.phone, cc: cart.cc, lang, tipPct: cart.tipPct, pm, cur }) });
      const j = (await r.json()) as CreateOrderResult | CreateOrderError;
      if (!j.ok) { setProc(null); setErr(j.error === "closed" ? t("ordersClosed") : t("errOrder")); return; }
      const active = { code: j.code, createdAt: new Date().toISOString(), status: 0, local: { items: j.items, type: cart.type, table: cart.type === "table" ? cart.table : null, name: cart.name, tip: j.tip, total: j.total, pm, paid: false, phone: cart.phone, cc: cart.cc, waUrl: j.waUrl, waText: j.waText, live: j.live } };
      if (j.checkoutUrl) { cart.setActive(active); cart.clear(); window.location.assign(j.checkoutUrl); return; }
      setProc("ok"); await wait(reducedMotion() ? 100 : 750);
      cart.setActive(active); cart.clear(); setStep("done"); setProc(null);
      if (!j.live && pm === "bar") showToast(t("sent"));
    } catch { setProc(null); setErr(t("errOrder")); }
  };

  const n = totals.count;
  const title = step === "cart" ? t("order") : step === "pay" ? t("payT") : t("doneT");
  return (
    <>
      <div className={`scrim${open ? " on" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div className={`ord${open ? " on" : ""}`} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open}>
        <div className="oh">
          <button className="bk" onClick={back} aria-label={t("back")}>←</button>
          <h2>{title}</h2>
          <span className="cnt">{step === "cart" && n ? tn("items", n) : ""}</span>
        </div>
        <div className="steps">
          {/* ---------- carrito ---------- */}
          <div className="st" data-pos={pos("cart")}>
            {!s.acceptOrders && <p className="notice" style={{ marginTop: 6 }}>{t("ordersClosed")}</p>}
            {!cart.lines.length ? (
              <div className="emptyc">
                <KoiMark mode="done" />
                <b>{t("empty")}</b><span>{t("emptyH")}</span>
                <button className="more" style={{ maxWidth: 240 }} onClick={() => setOpen(false)}>+ {t("more")}</button>
              </div>
            ) : (
              <>
                <div className="lines">
                  {cart.lines.map((l) => (
                    <div className={`line${removing === l.key ? " out" : ""}`} key={l.key}>
                      <LineIcon l={l} />
                      <span>
                        <b>{lineName(menu, l, lang)}</b><small>{lineDesc(menu, l, lang)}</small>
                        <span className="qty"><button onClick={() => setQty(l, -1)} aria-label={l.qty === 1 ? t("remove") : "-1"}>{l.qty === 1 ? "×" : "−"}</button><span>{l.qty}</span><button onClick={() => setQty(l, 1)} aria-label="+1">+</button></span>
                      </span>
                      <span className="lp">{price(l.price * l.qty)}</span>
                    </div>
                  ))}
                </div>
                <button className="more" onClick={() => setOpen(false)}>+ {t("more")}</button>
                <div className="blk">
                  <span className="lb">{t("type")}</span>
                  <div className="pills" role="radiogroup" aria-label={t("type")}>
                    <button role="radio" aria-checked={cart.type === "togo"} aria-pressed={cart.type === "togo"} onClick={() => cart.patch({ type: "togo" })}>{t("togo")}</button>
                    <button role="radio" aria-checked={cart.type === "table"} aria-pressed={cart.type === "table"} onClick={() => cart.patch({ type: "table" })}>{t("table")}</button>
                  </div>
                  {cart.type === "table" && (
                    <div className="pills" style={{ marginTop: 8 }} role="radiogroup" aria-label={t("tableN")}>
                      {Array.from({ length: s.tableCount }, (_, i) => i + 1).map((k) => <button key={k} role="radio" aria-checked={cart.table === k} aria-pressed={cart.table === k} onClick={() => cart.patch({ table: k })}>{t("tableN")} {k}</button>)}
                    </div>
                  )}
                </div>
                <div className="blk">
                  <label className="lb" htmlFor="ordName">{t("name")}</label>
                  <input id="ordName" className="inp" maxLength={24} placeholder={t("namePh")} value={cart.name} onChange={(e) => cart.patch({ name: e.target.value })} autoComplete="given-name" />
                </div>
                <div className="blk">
                  <label className="lb" htmlFor="ordWa">{t("waL")} <span className="op">· {t("opt")}</span></label>
                  <div className="wai">
                    <select aria-label={t("cc")} value={cart.cc} onChange={(e) => cart.patch({ cc: e.target.value })}><option value="52">🇲🇽 +52</option><option value="1">🇺🇸 +1</option></select>
                    <input id="ordWa" ref={waInput} className={`inp${waErr ? " err" : ""}`} type="tel" inputMode="numeric" placeholder={t("waPh")} value={cart.phone} autoComplete="tel-national" onChange={(e) => { let d = e.target.value.replace(/\D/g, ""); if (d.length > 10 && d.startsWith(cart.cc)) d = d.slice(cart.cc.length); cart.patch({ phone: d.slice(0, 10) }); setWaErr(false); }} />
                  </div>
                  <small className={`hint${waErr ? " err" : ""}`}>{waErr ? t("waErr") : t("waHint")}</small>
                </div>
                {s.tips.length > 1 && (
                  <div className="blk">
                    <span className="lb">{t("tip")}</span>
                    <div className="pills" role="radiogroup" aria-label={t("tip")}>{s.tips.map((v) => <button key={v} role="radio" aria-checked={cart.tipPct === v} aria-pressed={cart.tipPct === v} onClick={() => cart.patch({ tipPct: v })}>{v ? `${v}%` : t("noTip")}</button>)}</div>
                  </div>
                )}
                <div className="sum">
                  <div><span>{t("subtotal")}</span><span>{price(totals.sub)}</span></div>
                  {totals.tip > 0 && <div><span>{t("tip")}</span><span>{price(totals.tip)}</span></div>}
                  <div className="tot"><span>{t("total")}</span><span>{price(totals.total)}</span></div>
                  {cur === "mxn" && <small>≈ {usdApprox(totals.total, s.rate)} {t("approx")}</small>}
                </div>
              </>
            )}
          </div>
          {/* ---------- pago ---------- */}
          <div className="st" data-pos={pos("pay")}>
            <div className="paysum"><span>{t("toPayL")}</span><b>{price(totals.total)}</b><small>{tn("items", n)} · {cart.type === "table" ? `${t("tableN")} ${cart.table}` : t("togo")}</small></div>
            <span className="lb">{t("pm")}</span>
            <div className="paym" role="radiogroup" aria-label={t("pm")}>
              {methods.map((k) => (
                <button key={k} className="pm" role="radio" aria-checked={pm === k} aria-pressed={pm === k} onClick={() => cart.patch({ pm: k })}>
                  <span className="ico">{PAYI[k]}</span>
                  <span><b>{pmName[k]}{k === "express" && <em>{t("tourist")}</em>}</b><small>{pmSub[k]}</small></span>
                  <span className="rd" />
                </button>
              ))}
            </div>
            {methods.length > 1 && <p className="secnote">{LOCK}<span>{t("secure")}</span></p>}
            {err && <p className="notice" style={{ marginTop: 14 }}>{err}</p>}
          </div>
          {/* ---------- confirmación ---------- */}
          <div className="st" data-pos={pos("done")}>
            {step === "done" && cart.active && <OrderView code={cart.active.code} live={!!cart.active.local?.live} local={cart.active.local} />}
          </div>
        </div>
        <div className="foot">
          {step === "cart" && <button className="addb" disabled={!cart.lines.length || !s.acceptOrders} onClick={goPay}><span>{t("toPay")}</span><span>{price(totals.total)}</span></button>}
          {step === "pay" && <button className="addb" disabled={!!proc} onClick={confirm}><span>{pm === "bar" ? t("confirm") : t("payBtn")}</span><span>{price(totals.total)}</span></button>}
          {step === "done" && <button className="addb dark" onClick={() => setOpen(false)}><span>{t("backMenu")}</span><span>→</span></button>}
        </div>
        <div className={`proc${proc ? " on" : ""}`} aria-live="polite">
          {proc === "loading" && <><div className="spin" /><span>{pm === "bar" ? t("procBar") : t("proc")}</span></>}
          {proc === "ok" && <><svg className="chk" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#3F7A55" /><path d="M15 27 l7 7 l15 -16" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} /></svg><span>{pm === "bar" ? t("sent") : t("paidOk")}</span></>}
        </div>
      </div>
    </>
  );
}
