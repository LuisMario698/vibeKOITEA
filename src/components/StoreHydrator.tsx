"use client";
import { useEffect } from "react";
import { usePrefs } from "@/lib/store/prefs";
import { useCart } from "@/lib/store/cart";

/** Rehidrata las preferencias y el carrito después del primer render (evita desajustes con el HTML del servidor)
    y aplica ?lang= / ?cur= de la URL (para códigos QR dirigidos a turistas). */
export default function StoreHydrator() {
  useEffect(() => {
    void usePrefs.persist.rehydrate();
    void useCart.persist.rehydrate();
    const q = new URLSearchParams(window.location.search);
    const lang = q.get("lang");
    const cur = q.get("cur");
    const prefs = usePrefs.getState();
    if (lang === "en" || lang === "es") prefs.setLang(lang);
    else if (!localStorage.getItem("koi-prefs") && /^en\b/i.test(navigator.language)) prefs.setLang("en");
    if (cur === "usd" || cur === "mxn") prefs.setCur(cur);
    else if (!localStorage.getItem("koi-prefs") && /^en-US/i.test(navigator.language)) prefs.setCur("usd");
    // Un pedido activo de hace más de 6 horas ya no se muestra.
    const a = useCart.getState().active;
    if (a && Date.now() - new Date(a.createdAt).getTime() > 6 * 3600e3) useCart.getState().setActive(null);
  }, []);
  return null;
}
