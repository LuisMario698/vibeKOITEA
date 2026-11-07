"use client";
import { useEffect } from "react";

/** Registra el service worker (solo en producción) para que el menú abra rápido y funcione con mala señal.
    En desarrollo quita cualquier worker que haya quedado de una prueba de producción en el mismo puerto. */
export default function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister())).catch(() => undefined);
      return;
    }
    const v = encodeURIComponent(process.env.NEXT_PUBLIC_BUILD_ID || "1");
    const t = setTimeout(() => { navigator.serviceWorker.register(`/sw.js?v=${v}`, { scope: "/", updateViaCache: "none" }).catch(() => undefined); }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
