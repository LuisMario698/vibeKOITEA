"use client";
import { useEffect, useRef, useState } from "react";
import KoiMark from "@/components/brand/KoiMark";
import { useT } from "@/lib/i18n/useT";
import { reducedMotion } from "@/lib/utils";

const KEY = "koi-splash";
type State = "idle" | "show" | "gone" | "off";

/** Pantalla de bienvenida: el koi se dibuja mientras cargan tipografías y el estanque. Solo una vez por sesión. */
export default function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [state, setState] = useState<State>("idle");
  const finishRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch { /* noop */ }
    let done = false;
    const finish = (animated: boolean) => {
      if (done) return; done = true;
      try { sessionStorage.setItem(KEY, "1"); } catch { /* noop */ }
      document.body.classList.remove("lock");
      setState(animated ? "gone" : "off"); onDone();
    };
    finishRef.current = () => finish(true);
    if (seen) { const r = requestAnimationFrame(() => finish(false)); return () => cancelAnimationFrame(r); }
    const raf = requestAnimationFrame(() => setState("show"));
    document.body.classList.add("lock");
    const min = reducedMotion() ? 150 : 1900;
    const fonts = (document.fonts?.ready ?? Promise.resolve()).then(() => undefined);
    const timer = new Promise<void>((r) => setTimeout(r, min));
    Promise.all([fonts, timer]).then(() => setTimeout(() => finish(true), 150));
    const hard = setTimeout(() => finish(true), 4500);
    return () => { cancelAnimationFrame(raf); clearTimeout(hard); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (state === "off") return null;
  if (state === "idle") return <div className="splash" aria-hidden="true" />;
  if (state === "gone") return <div className="splash gone" aria-hidden="true" />;
  return (
    <div className="splash" role="status" aria-live="polite" aria-label="Koi Tea">
      <div className="rings" aria-hidden="true"><i /><i /><i /></div>
      <KoiMark mode="play" live />
      <div className="nm">KOI TEA</div>
      <div className="sb">{t("sub")}</div>
      <div className="dots" aria-hidden="true"><i /><i /><i /></div>
      <button className="skip" onClick={() => finishRef.current()}>{t("enter")}</button>
    </div>
  );
}
