import { reducedMotion } from "./utils";

/** Un producto "vuela" desde su tarjeta hasta la barra del pedido. */
export function flyToCart(from: Element | null, svgMarkup: string | null, onLand?: () => void) {
  if (reducedMotion() || !from || !svgMarkup) { onLand?.(); return; }
  const r = from.getBoundingClientRect();
  const bar = document.querySelector(".cartbar");
  const br = bar?.getBoundingClientRect();
  const x1 = br && br.width ? br.left + 28 : window.innerWidth * 0.26, y1 = br && br.width ? br.top + br.height / 2 : window.innerHeight - 40;
  const f = document.createElement("div");
  f.className = "fly"; f.innerHTML = svgMarkup; document.body.appendChild(f);
  const x0 = r.left + r.width / 2, y0 = r.top + r.height * 0.45;
  f.style.left = x0 + "px"; f.style.top = y0 + "px";
  const a = f.animate(
    [
      { transform: "translate(0,0) scale(1.6)", opacity: 1 },
      { transform: `translate(${(x1 - x0) * 0.45}px,${(y1 - y0) * 0.45 - 150}px) scale(1.15) rotate(-14deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1 - x0}px,${y1 - y0}px) scale(.3) rotate(10deg)`, opacity: 0.5 },
    ],
    { duration: 820, easing: "cubic-bezier(.45,0,.3,1)" },
  );
  a.onfinish = () => { f.remove(); onLand?.(); };
}

export function ripple(el: HTMLElement, e: { clientX: number; clientY: number }) {
  if (reducedMotion()) return;
  const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 1.6, sp = document.createElement("span");
  sp.className = "rip"; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
  el.appendChild(sp); setTimeout(() => sp.remove(), 700);
}

export function popCartBar() {
  if (reducedMotion()) return;
  document.querySelectorAll<HTMLElement>(".cartbar").forEach((el) => el.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 380 }));
}
