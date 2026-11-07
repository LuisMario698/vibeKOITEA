"use client";
import { useEffect, type RefObject } from "react";

/* ---------- bloqueo de scroll con dueño: cada capa solo quita el bloqueo que puso ---------- */
const owners = new Set<string>();
export function lockScroll(owner: string) {
  owners.add(owner);
  document.body.classList.add("lock");
}
export function unlockScroll(owner: string) {
  if (!owners.delete(owner)) return;
  if (!owners.size) document.body.classList.remove("lock");
}

/* ---------- foco en diálogos: entra al abrir, no se escapa con Tab y vuelve al origen al cerrar ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const focusables = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest("[hidden]") && el.getClientRects().length > 0);

export function useDialogFocus(open: boolean, root: RefObject<HTMLElement | null>, initial?: RefObject<HTMLElement | null>, delay = 120) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const tm = window.setTimeout(() => {
      const el = initial?.current ?? (root.current ? focusables(root.current)[0] : null);
      el?.focus({ preventScroll: true });
    }, delay);
    const onKey = (e: KeyboardEvent) => {
      const r = root.current;
      if (e.key !== "Tab" || !r) return;
      const f = focusables(r); if (!f.length) return;
      const first = f[0], last = f[f.length - 1], cur = document.activeElement;
      if (!r.contains(cur)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(tm);
      document.removeEventListener("keydown", onKey);
      if (opener && opener.isConnected && opener !== document.body) opener.focus({ preventScroll: true });
    };
  }, [open, root, initial, delay]);
}
