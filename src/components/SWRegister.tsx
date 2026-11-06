"use client";
import { useEffect } from "react";

/** Registra el service worker (solo en producción) para que el menú abra rápido y funcione con mala señal. */
export default function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const t = setTimeout(() => { navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined); }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
