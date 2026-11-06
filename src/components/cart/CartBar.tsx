"use client";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { usePrefs } from "@/lib/store/prefs";
import { useT } from "@/lib/i18n/useT";
import { useMenu } from "@/components/menu/MenuContext";
import { cartTotals } from "@/lib/menu/helpers";
import { formatPrice } from "@/lib/money";
import { popCartBar } from "@/lib/fly";

/** Barra flotante: muestra el pedido en curso o el estado del último pedido. */
export default function CartBar() {
  const menu = useMenu(); const { t, tn } = useT(); const cur = usePrefs((s) => s.cur);
  const lines = useCart((s) => s.lines); const active = useCart((s) => s.active); const tipPct = useCart((s) => s.tipPct);
  const setOrderOpen = useUI((s) => s.setOrderOpen);
  const { count, total } = cartTotals(lines, tipPct);
  const prev = useRef(count);
  useEffect(() => { if (count > prev.current) popCartBar(); prev.current = count; }, [count]);
  const tracking = !count && active && active.status < 3;
  const n = count ? count : tracking ? 1 : 0;
  const st = active ? [t("st0"), t("st1"), t("st2"), t("st3")][Math.min(3, active.status)] : "";
  return (
    <div className={`cartbar${tracking ? " trk" : ""}`} data-n={n} aria-hidden={n === 0}>
      <span>{count ? `${tn("drinks", count)} · ${formatPrice(total, cur, menu.settings.rate)}` : `${active?.code} · ${st}`}</span>
      <button onClick={() => setOrderOpen(true)} tabIndex={n ? 0 : -1}>{count ? t("see") : t("track")}</button>
    </div>
  );
}
