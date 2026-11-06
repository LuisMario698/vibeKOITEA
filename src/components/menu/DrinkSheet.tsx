"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMenu } from "./MenuContext";
import { useUI } from "@/lib/store/ui";
import { useCart } from "@/lib/store/cart";
import { usePrefs } from "@/lib/store/prefs";
import { useT } from "@/lib/i18n/useT";
import { formatPrice } from "@/lib/money";
import { tint } from "@/lib/color";
import { ICE_SHORT, L, drinkById, toppingById } from "@/lib/menu/helpers";
import { SWEET, type Drink, type DrinkOpts } from "@/lib/menu/types";
import CupMini from "./CupMini";
import { flyToCart, popCartBar } from "@/lib/fly";
import { hasWebGL } from "@/lib/three/common";
import type { CupEngine } from "@/lib/three/cup";
import { reducedMotion } from "@/lib/utils";

/** Ficha de una bebida: se abre con una onda desde el dedo, arma el vaso en 3D y deja elegir topping, dulzor y hielo. */
export default function DrinkSheet() {
  const menu = useMenu();
  const { t, lang } = useT();
  const cur = usePrefs((s) => s.cur);
  const { drink: id, origin, closeDrink, showToast } = useUI();
  const add = useCart((s) => s.add);
  const [shown, setShown] = useState<Drink | null>(null);
  const [on, setOn] = useState(false);
  const [opts, setOpts] = useState<DrinkOpts>({ top: "tapioca", sweet: 2, ice: 2 });
  const [fallback, setFallback] = useState(false);
  const g3 = useRef<HTMLDivElement>(null);
  const det = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const engine = useRef<CupEngine | null>(null);
  const price = (mxn: number) => formatPrice(mxn, cur, menu.settings.rate);

  const cupTop = useCallback((o: DrinkOpts) => { const tp = toppingById(menu, o.top); return { top: { type: tp?.type ?? "tapioca", color: tp?.color ?? "#2A1810" }, ice: o.ice, sweet: o.sweet }; }, [menu]);

  // abrir
  useEffect(() => {
    if (!id) return;
    const d = drinkById(menu, id); if (!d) return;
    const o: DrinkOpts = { top: d.topping, sweet: 2, ice: 2 };
    const el = det.current;
    if (el) {
      el.style.setProperty("--cx", (origin?.x ?? window.innerWidth / 2) + "px");
      el.style.setProperty("--cy", (origin?.y ?? window.innerHeight / 2) + "px");
      el.style.setProperty("--dbg", `radial-gradient(80% 60% at 50% 40%, ${tint(d.kind === "fruit" ? d.c2 ?? d.c1 : d.c1, 0.55)}, ${tint(d.pop, 0.2)})`);
    }
    const raf = requestAnimationFrame(() => { setShown(d); setOpts(o); requestAnimationFrame(() => setOn(true)); });
    document.body.classList.add("lock");
    let cancelled = false;
    const delay = setTimeout(async () => {
      if (!hasWebGL()) { setFallback(true); return; }
      const { getCup } = await import("@/lib/three/cup");
      const cup = getCup();
      if (cancelled) return;
      if (!cup || !g3.current) { setFallback(true); return; }
      engine.current = cup; cup.mount(g3.current, d, cupTop(o));
      setFallback(false);
    }, reducedMotion() ? 0 : 240);
    setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 300);
    return () => { cancelled = true; cancelAnimationFrame(raf); clearTimeout(delay); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // cerrar
  useEffect(() => {
    if (id) return;
    const r = requestAnimationFrame(() => setOn(false));
    document.body.classList.remove("lock");
    const tm = setTimeout(() => { engine.current?.stop(); engine.current = null; if (!useUI.getState().drink) setShown(null); }, 800);
    return () => { cancelAnimationFrame(r); clearTimeout(tm); };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && useUI.getState().drink) closeDrink(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [closeDrink]);

  const change = (k: keyof DrinkOpts, v: string | number) => {
    const o = { ...opts, [k]: v } as DrinkOpts; setOpts(o);
    engine.current?.opts(cupTop(o), k);
  };
  const addToOrder = () => {
    if (!shown) return;
    add({ kind: "drink", ref: shown.id, opts: { ...opts }, qty: 1, price: shown.price });
    const svg = miniRef.current?.querySelector("svg")?.outerHTML ?? null;
    closeDrink();
    flyToCart(engine.current?.canvas ?? g3.current, svg, popCartBar);
    showToast(t("added"));
  };

  const d = shown;
  const topInfo = d ? toppingById(menu, opts.top) : null;
  const toppings = menu.toppings.filter((x) => x.available || x.id === opts.top);
  return (
    <div className={`det${on ? " on" : ""}`} ref={det} role="dialog" aria-modal="true" aria-labelledby="dA-n" aria-hidden={!on}>
      <div className="g3" ref={g3}>
        {d && fallback && <div className="fb3d"><CupMini drink={d} toppingColor={topInfo?.color ?? "#2A1810"} /></div>}
        {!fallback && <span className="hint3">{t("drag")}</span>}
      </div>
      <button className="x" ref={closeBtn} onClick={closeDrink} aria-label={t("close")}>←</button>
      <div className="body">
        {d && (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <h3 id="dA-n">{L(d.name, lang)}</h3>
              <span className="font-mono text-sm font-medium whitespace-nowrap">{price(d.price)}</span>
            </div>
            <p className="ds">{L(d.desc, lang)}</p>
            <div>
              <span className="lb">{t("topping")}</span>
              <div className="pills" role="radiogroup" aria-label={t("topping")}>
                {toppings.map((x) => <button key={x.id} role="radio" aria-checked={opts.top === x.id} aria-pressed={opts.top === x.id} onClick={() => change("top", x.id)} disabled={!x.available}><i style={{ background: x.color }} />{L(x.name, lang)}</button>)}
              </div>
            </div>
            <div>
              <span className="lb">{t("sweet")}</span>
              <div className="pills" role="radiogroup" aria-label={t("sweet")}>
                {SWEET.map((x, i) => <button key={x} role="radio" aria-checked={opts.sweet === i} aria-pressed={opts.sweet === i} onClick={() => change("sweet", i)}>{x}</button>)}
              </div>
            </div>
            <div>
              <span className="lb">{t("ice")}</span>
              <div className="pills" role="radiogroup" aria-label={t("ice")}>
                {ICE_SHORT[lang].map((x, i) => <button key={x} role="radio" aria-checked={opts.ice === i} aria-pressed={opts.ice === i} onClick={() => change("ice", i)}>{x}</button>)}
              </div>
            </div>
            <button className="addb" onClick={addToOrder}><span>{t("addTo")}</span><span>{price(d.price)}</span></button>
            <div ref={miniRef} hidden aria-hidden="true"><CupMini drink={d} toppingColor={topInfo?.color ?? "#2A1810"} /></div>
          </>
        )}
      </div>
    </div>
  );
}
