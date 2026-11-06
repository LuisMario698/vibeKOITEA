"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { reducedMotion } from "@/lib/utils";

export interface ChipItem { id: string; label: string }

/** Chips de categorías pegados arriba, con un indicador que se desliza y sigue la sección visible. */
export default function Chips({ items }: { items: ChipItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const box = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const clickLock = useRef(false);

  const move = (id: string) => {
    const b = box.current?.querySelector<HTMLButtonElement>(`[data-go="${id}"]`), i = ind.current, c = box.current;
    if (!b || !i || !c) return;
    i.style.width = b.offsetWidth + "px"; i.style.transform = `translateX(${b.offsetLeft}px)`; i.classList.add("on");
    c.scrollTo({ left: b.offsetLeft - c.clientWidth / 2 + b.offsetWidth / 2, behavior: reducedMotion() ? "auto" : "smooth" });
  };
  useLayoutEffect(() => { if (active) move(active); }, [active]);
  useEffect(() => {
    const els = items.map((it) => document.getElementById("sec-" + it.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => {
      if (clickLock.current) return;
      const hit = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id.slice(4));
    }, { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.1, 0.5] });
    els.forEach((el) => io.observe(el));
    const onResize = () => { if (active) move(active); };
    window.addEventListener("resize", onResize);
    return () => { io.disconnect(); window.removeEventListener("resize", onResize); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  const go = (id: string) => {
    const el = document.getElementById("sec-" + id); if (!el) return;
    clickLock.current = true; setTimeout(() => { clickLock.current = false; }, 900); setActive(id);
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  };
  return (
    <nav className="chips no-scrollbar" ref={box} aria-label="Categorías">
      <span className="ind" ref={ind} aria-hidden="true" />
      {items.map((it) => (
        <button key={it.id} className={`chip${active === it.id ? " on" : ""}`} data-go={it.id} onClick={() => go(it.id)} aria-current={active === it.id ? "true" : undefined}>{it.label}</button>
      ))}
    </nav>
  );
}
