"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePrefs } from "@/lib/store/prefs";
import { useT } from "@/lib/i18n/useT";
import { useMenu } from "./MenuContext";
import { L } from "@/lib/menu/helpers";
import type { PondEngine } from "@/lib/three/pond";
import type { Pond2D } from "@/lib/three/pond2d";
import { hasWebGL } from "@/lib/three/common";

/** El estanque: koi en 3D nadando bajo el logo, selector de idioma y moneda, y la frase de la marca. */
export default function PondHero({ paused }: { paused: boolean }) {
  const { t, lang } = useT();
  const menu = useMenu();
  const { cur, koi, setLang, setCur, setKoi } = usePrefs();
  const host = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const eng = useRef<PondEngine | Pond2D | null>(null);
  const [fed, setFed] = useState(false);
  const [is3d, setIs3d] = useState(true);
  const [hint, setHint] = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!cv.current || !host.current) return;
      if (hasWebGL()) {
        const { PondEngine } = await import("@/lib/three/pond");
        if (!alive || !cv.current || !host.current) return;
        const e = PondEngine.create(cv.current, host.current);
        if (e) { e.onFeed = () => setFed(true); e.setCount(usePrefs.getState().koi); eng.current = e; if (!pausedRef.current) e.start(); setHint(true); return; }
      }
      const { Pond2D } = await import("@/lib/three/pond2d");
      if (!alive || !cv.current) return;
      setIs3d(false); const e = new Pond2D(cv.current); eng.current = e; if (!pausedRef.current) e.start();
    })();
    return () => { alive = false; eng.current?.dispose(); eng.current = null; };
  }, []);
  // si el motor carga con una ficha ya abierta, arranca en pausa
  useEffect(() => { pausedRef.current = paused; const e = eng.current; if (!e) return; if (paused) e.stop(); else e.start(); }, [paused]);
  useEffect(() => { const e = eng.current as PondEngine | null; if (e && "setCount" in e) e.setCount(koi); }, [koi]);
  useEffect(() => { const id = setTimeout(() => setFed(true), 12000); return () => clearTimeout(id); }, []);

  return (
    <div className={`pond${is3d ? " d3" : ""}`} ref={host}>
      <canvas ref={cv} className={is3d ? "c3" : ""} role="img" aria-label={lang === "en" ? "Pond with koi swimming. Tap the water to feed them." : "Estanque con koi nadando. Toca el agua para alimentarlos."} />
      {is3d && hint && <span className={`feed${fed ? " off" : ""}`}>{t("feed")}</span>}
      <div className="top">
        <div className="mini">
          <span className="logo"><Image src="/img/logo_big.jpg" alt="Koi Tea" width={38} height={38} priority /></span>
        </div>
        <div className="mini">
          <div className="seg" role="group" aria-label={t("lang")}>
            <button aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
          </div>
          <div className="seg" role="group" aria-label={t("currency")}>
            <button aria-pressed={cur === "mxn"} onClick={() => setCur("mxn")}>MXN</button>
            <button aria-pressed={cur === "usd"} onClick={() => setCur("usd")}>USD</button>
          </div>
        </div>
      </div>
      <div className="ttl">
        <h1>Koi Tea</h1>
        <p>{L(menu.settings.tagline, lang)} · {L(menu.settings.origin, lang)}</p>
      </div>
      {is3d && (
        <div className="koictl" role="group" aria-label={t("koiCount")}>
          {[1, 2, 3].map((n) => <button key={n} aria-pressed={koi === n} onClick={() => setKoi(n)} aria-label={`${n} koi`}>{n}</button>)}
        </div>
      )}
    </div>
  );
}
