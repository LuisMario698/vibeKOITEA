"use client";
import { useEffect, useRef, useState } from "react";
import { useMenu } from "./MenuContext";
import { useUI } from "@/lib/store/ui";
import { useCart } from "@/lib/store/cart";
import { usePrefs } from "@/lib/store/prefs";
import { useT } from "@/lib/i18n/useT";
import { formatPrice } from "@/lib/money";
import { L, merchById } from "@/lib/menu/helpers";
import type { Merch } from "@/lib/menu/types";
import MerchArt from "./MerchArt";
import { flyToCart, popCartBar } from "@/lib/fly";
import { hasWebGL } from "@/lib/three/common";
import type { MerchEngine } from "@/lib/three/merch";
import { reducedMotion } from "@/lib/utils";
import { lockScroll, unlockScroll, useDialogFocus } from "@/lib/dialog";

/** Ficha de merch: el producto en 3D (o inclinable si no hay WebGL), talla y cantidad. */
export default function MerchSheet() {
  const menu = useMenu(); const { t, lang } = useT(); const cur = usePrefs((s) => s.cur);
  const { merch: id, closeMerch, showToast } = useUI(); const add = useCart((s) => s.add);
  const [shown, setShown] = useState<Merch | null>(null);
  const [on, setOn] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [is3d, setIs3d] = useState(false);
  const stage = useRef<HTMLDivElement>(null); const prod = useRef<HTMLDivElement>(null); const art = useRef<HTMLDivElement>(null);
  const engine = useRef<MerchEngine | null>(null);
  const sheet = useRef<HTMLDivElement>(null); const closeBtn = useRef<HTMLButtonElement>(null);
  const price = (mxn: number) => formatPrice(mxn, cur, menu.settings.rate);

  useEffect(() => {
    if (!id) return;
    const m = merchById(menu, id); if (!m) return;
    const raf = requestAnimationFrame(() => { setShown(m); setSize(m.sizes?.length ? (m.sizes.includes("M") ? "M" : m.sizes[0]) : null); setQty(1); requestAnimationFrame(() => setOn(true)); });
    lockScroll("merch");
    let cancelled = false;
    (async () => {
      if (!hasWebGL() || !stage.current) { setIs3d(false); return; }
      const { getMerch } = await import("@/lib/three/merch");
      const e = getMerch(); if (cancelled || !e || !stage.current) { setIs3d(false); return; }
      engine.current = e; setIs3d(true); e.mount(stage.current); e.show(m.art);
    })();
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    if (id) return;
    const r = requestAnimationFrame(() => setOn(false)); unlockScroll("merch");
    const tm = setTimeout(() => { engine.current?.stop(); if (!useUI.getState().merch) setShown(null); }, 700);
    return () => { cancelAnimationFrame(r); clearTimeout(tm); };
  }, [id]);
  useDialogFocus(!!id, sheet, closeBtn, 300);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && useUI.getState().merch) closeMerch(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [closeMerch]);

  const tilt = (e: React.PointerEvent) => {
    if (is3d || reducedMotion() || !stage.current || !prod.current) return;
    const r = stage.current.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    prod.current.style.transform = `rotateY(${px * 30}deg) rotateX(${-py * 20}deg) scale(1.04)`;
  };
  const addToOrder = () => {
    if (!shown) return;
    add({ kind: "merch", ref: shown.id, size, qty, price: shown.price });
    const svg = art.current?.querySelector("svg")?.outerHTML ?? null;
    closeMerch(); flyToCart(engine.current?.canvas ?? art.current, svg, popCartBar); showToast(t("added"));
  };
  const m = shown;
  return (
    <div className={`det${on ? " on" : ""}`} ref={sheet} role="dialog" aria-modal="true" aria-labelledby="mr-n" aria-hidden={!on} inert={!on} style={{ ["--cx" as string]: "50%", ["--cy" as string]: "100%", ["--dbg" as string]: m ? `radial-gradient(70% 60% at 50% 45%, #FFFDF9, ${m.bg})` : undefined }}>
      <div className="g3" ref={stage} onPointerMove={tilt} onPointerLeave={() => { if (prod.current) prod.current.style.transform = ""; }} style={{ perspective: 700 }}>
        {m && !is3d && (
          <div className="fb3d"><div ref={prod} style={{ width: "62%", transition: "transform .25s ease-out", filter: "drop-shadow(0 18px 16px rgba(40,25,15,.2))" }}><div ref={art}><MerchArt art={m.art} /></div></div></div>
        )}
        {m && is3d && <div ref={art} hidden aria-hidden="true"><MerchArt art={m.art} /></div>}
        <span className="hint3">{is3d ? t("drag") : t("tilt")}</span>
      </div>
      <button className="x" ref={closeBtn} onClick={closeMerch} aria-label={t("close")}>←</button>
      <div className="body">
        {m && (
          <>
            <div className="flex items-baseline justify-between gap-2"><h3 id="mr-n">{L(m.name, lang)}</h3><span className="font-mono text-sm font-medium whitespace-nowrap">{price(m.price)}</span></div>
            <p className="ds">{L(m.desc, lang)}</p>
            {m.sizes && (
              <div>
                <span className="lb">{t("size")}</span>
                <div className="pills" role="group" aria-label={t("size")}>{m.sizes.map((z) => <button key={z} aria-pressed={size === z} onClick={() => { setSize(z); engine.current?.size(z); }}>{z}</button>)}</div>
              </div>
            )}
            <div>
              <span className="lb">{t("qty")}</span>
              <span className="qty"><button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−1">−</button><span>{qty}</span><button onClick={() => setQty((q) => Math.min(9, q + 1))} aria-label="+1">+</button></span>
            </div>
            <p className="pnote">{t("pickup")}</p>
            <button className="addb" onClick={addToOrder}><span>{t("addTo")}</span><span>{price(m.price * qty)}</span></button>
          </>
        )}
      </div>
    </div>
  );
}
