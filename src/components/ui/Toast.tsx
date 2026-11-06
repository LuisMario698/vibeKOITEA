"use client";
import { useEffect, useState } from "react";
import { useUI } from "@/lib/store/ui";

export default function Toast() {
  const toast = useUI((s) => s.toast);
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!toast) return;
    const r = requestAnimationFrame(() => { setMsg(toast.msg); setOn(true); });
    const t = setTimeout(() => setOn(false), 1900);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, [toast]);
  return <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">{msg}</div>;
}
