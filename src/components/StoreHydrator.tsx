"use client";
import { useEffect } from "react";
import { usePrefs } from "@/lib/store/prefs";
import { useCart } from "@/lib/store/cart";

/** Rehidrata las preferencias y el carrito después del primer render (evita desajustes con el HTML del servidor)
    y aplica ?lang= / ?cur= de la URL (para códigos QR dirigidos a turistas). */
export default function StoreHydrator() {
  const lang = usePrefs((s) => s.lang);
  useEffect(() => {
    // ¿primera visita? se decide antes de tocar el store (cualquier set() ya escribe en localStorage)
    let firstVisit = false;
    try { firstVisit = !localStorage.getItem("koi-prefs"); } catch { /* sin almacenamiento */ }
    void usePrefs.persist.rehydrate();
    void useCart.persist.rehydrate();
    const q = new URLSearchParams(window.location.search);
    const qLang = q.get("lang");
    const qCur = q.get("cur");
    const prefs = usePrefs.getState();
    const english = /^en\b/i.test(navigator.language);
    if (qLang === "en" || qLang === "es") prefs.setLang(qLang);
    else if (firstVisit && english) prefs.setLang("en");
    if (qCur === "usd" || qCur === "mxn") prefs.setCur(qCur);
    else if (firstVisit && (/^en-US/i.test(navigator.language) || (qLang === "en" && english))) prefs.setCur("usd");
    // Un pedido activo de hace más de 6 horas ya no se muestra.
    const a = useCart.getState().active;
    if (a && Date.now() - new Date(a.createdAt).getTime() > 6 * 3600e3) useCart.getState().setActive(null);
  }, []);
  // el idioma del documento sigue al de la interfaz (lectores de pantalla, traductor del navegador)
  useEffect(() => { document.documentElement.lang = lang === "en" ? "en" : "es-MX"; }, [lang]);
  return null;
}
