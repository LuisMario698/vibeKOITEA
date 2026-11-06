"use client";
import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/useT";
import { reducedMotion } from "@/lib/utils";

const ICONS = [
  <svg key="0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7" /></svg>,
  <svg key="1" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h8l-1 9H5z" /><path d="M3.5 5h9M9 5l1.6-3.5" /></svg>,
  <svg key="2" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" /></svg>,
];

/** Recibido → Preparando → ¡Listo!, con barra de avance y confeti al estar listo. */
export default function Tracker({ status, live }: { status: number; live: boolean }) {
  const { t } = useT();
  const top = useRef<HTMLDivElement>(null);
  const prev = useRef(status);
  useEffect(() => {
    if (status >= 2 && prev.current < 2 && !reducedMotion() && top.current) {
      const cols = ["#E2482B", "#F4C552", "#FFFDF9", "#7FAA9A", "#27211E"];
      for (let i = 0; i < 22; i++) {
        const c = document.createElement("span"); c.className = "conf"; c.style.background = cols[i % cols.length]; c.style.left = "50%"; c.style.top = "30%"; top.current.appendChild(c);
        const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
        c.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d + 40}px)) scale(.6)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => c.remove();
      }
    }
    prev.current = status;
  }, [status]);
  const s = Math.min(2, status);
  return (
    <div ref={top} style={{ position: "relative" }}>
      <div className="trk" aria-label={`${t("st0")} → ${t("st1")} → ${t("st2")}`}>
        <div className="bar"><i style={{ width: `${(status === 9 ? 0 : s / 2) * 100}%` }} /></div>
        {[t("st0"), t("st1"), t("st2")].map((lbl, i) => (
          <div key={i} className={`s${i <= s && status !== 9 ? " on" : ""}${i === status && status < 2 ? " now" : ""}`}><span className="dot">{ICONS[i]}</span>{lbl}</div>
        ))}
      </div>
      <p className={`eta${status >= 2 && status !== 9 ? " ready" : ""}`}>
        {status === 9 ? t("cancelledMsg") : status >= 3 ? t("deliveredMsg") : status === 2 ? t("readyMsg") : live ? `${t("eta")}: ~${status === 0 ? 6 : 3} ${t("min")}` : t("trackLocal")}
      </p>
    </div>
  );
}
