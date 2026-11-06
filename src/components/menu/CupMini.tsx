import { useId } from "react";
import type { Drink } from "@/lib/menu/types";

const PEARLS: Array<[number, number]> = [[18, 80], [26, 82], [34, 82], [42, 80], [22, 74], [30, 75], [38, 74]];

/** Vaso ilustrado de una bebida (SVG). `toppingColor` pinta las perlas; en hover ondea y las perlas flotan. */
export default function CupMini({ drink, toppingColor, className }: { drink: Pick<Drink, "kind" | "c1" | "c2">; toppingColor: string; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fruit = drink.kind === "fruit";
  const c2 = drink.c2 ?? drink.c1;
  const liq = fruit ? `url(#${id}g)` : drink.c1;
  return (
    <svg viewBox="0 0 60 92" className={className} aria-hidden="true">
      <defs>
        {fruit && (
          <linearGradient id={`${id}g`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={drink.c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        )}
        <clipPath id={id}><path d="M8 18H52L47 84Q30 88 13 84Z" /></clipPath>
      </defs>
      <ellipse cx="30" cy="88" rx="18" ry="3" fill="#000" opacity=".1" />
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="60" height="92" fill="#fff" opacity=".5" />
        <g className="wv"><path d="M-30 27 q7.5 -3.2 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 V96 H-30 Z" fill={liq} /></g>
        {drink.kind === "brown" && <path d="M18 30c2 14-2 22 1 40M30 28c-2 16 3 26 0 44M42 30c2 12-2 24 1 40" stroke={c2} strokeWidth="4" fill="none" opacity=".7" />}
        <g className="pe">{PEARLS.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.6" fill={toppingColor} stroke="rgba(0,0,0,.15)" strokeWidth=".6" />)}</g>
      </g>
      <path d="M8 18H52L47 84Q30 88 13 84Z" fill="none" stroke="#27211E" strokeOpacity=".35" strokeWidth="1.2" />
      <ellipse cx="30" cy="18" rx="23" ry="3.2" fill="#FBF6EF" stroke="#27211E" strokeOpacity=".35" />
      <path d="M34 22L41 0" stroke="#E2482B" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
