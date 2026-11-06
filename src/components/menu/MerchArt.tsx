import type { MerchArt as Art } from "@/lib/menu/types";

const ink = "#27211E";

function Koi({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill="none" stroke={ink} strokeWidth="1.4" strokeLinejoin="round">
      <path d="M0 -16 C7 -14 8 -2 5 6 C3 12 1 15 0 18 C-1 15 -3 12 -5 6 C-8 -2 -7 -14 0 -16 Z" />
      <path d="M0 18 L-6 25 L0 22 L6 25 Z" />
      <path d="M-6 -4 l-5 3 M6 -4 l5 3" />
      <circle cx="-2.2" cy="-10" r=".9" fill={ink} stroke="none" /><circle cx="2.2" cy="-10" r=".9" fill={ink} stroke="none" />
      <circle cx="0" cy="-3" r="1.6" /><circle cx="-2" cy="3" r="1.2" /><circle cx="2.2" cy="7" r="1.2" />
    </g>
  );
}

/** Ilustración plana de cada producto de merch. */
export default function MerchArt({ art, className }: { art: Art; className?: string }) {
  if (art === "teeBlack" || art === "teeCream") {
    const dark = art === "teeBlack", f = dark ? "#2A2523" : "#F7F2E7", st = dark ? "#141110" : ink;
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
        <path d="M40 16 L22 22 L8 42 L22 50 L29 44 L29 110 L91 110 L91 44 L98 50 L112 42 L98 22 L80 16 Q74 27 60 27 Q46 27 40 16 Z" fill={f} stroke={st} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M44 16 Q60 34 76 16" fill="none" stroke={st} strokeWidth="2" />
        <path d="M29 50 V44 M91 50 V44" stroke={dark ? "#5A504B" : "#CFC6B6"} strokeWidth="1.4" />
        {dark ? (
          <>
            <text x="45" y="50" fontFamily="var(--font-poster), sans-serif" fontSize="7.5" fill="#E9D7B5">KOI TEA</text>
            <text x="46.5" y="55.5" fontFamily="var(--font-mono), monospace" fontSize="2.7" letterSpacing=".6" fill="#E9D7B5">BOBA SHOP</text>
          </>
        ) : (
          <>
            <g transform="translate(60 64)" fill="none" stroke={ink} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M-14 -18 L-11 4 L-1 4 L2 -18 Z" /><path d="M-15 -18 H3" /><path d="M-3 -18 L1 -27" />
              {[[-9, -1], [-5, 0], [-1, -1], [-7, -4], [-3, -4]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.1" fill={ink} stroke="none" />)}
              <path d="M8 -24 l3 -2 l3 2 M14 -26 l3 -2 l3 2" /><ellipse cx="13" cy="-1" rx="5.5" ry="3.6" />
              <path d="M8 -2 q-3 -4 -1 -6 M18 -2 q3 -4 1 -6 M9 2 l-3 2.5 M17 2 l3 2.5 M11 2.6 l-1 3 M15 2.6 l1 3" />
              <path d="M-18 11 q4.5 -3 9 0 t9 0 t9 0 t9 0 M-18 16 q4.5 -3 9 0 t9 0 t9 0 t9 0" />
            </g>
            <text x="60" y="94" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="4.2" letterSpacing=".8" fill={ink}>PEÑASCO, SON, MX</text>
          </>
        )}
      </svg>
    );
  }
  if (art === "tote") {
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
        <path d="M44 42 C44 10 76 10 76 42" fill="none" stroke="#D9CBB2" strokeWidth="5" strokeLinecap="round" />
        <path d="M28 40 L92 40 L96 112 L24 112 Z" fill="#F3EAD8" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <Koi x={52} y={77} rot={-28} /><Koi x={69} y={72} rot={152} />
        <text x="31" y="50" fontFamily="var(--font-mono), monospace" fontSize="4" letterSpacing=".6" fill={ink}>ROCKY POINT, MX</text>
        <text x="89" y="105" textAnchor="end" fontFamily="var(--font-poster), sans-serif" fontSize="5.5" fill={ink}>KOI TEA</text>
      </svg>
    );
  }
  const dark = art === "capBlack", f = dark ? "#2A2523" : "#D8CFC0", st = dark ? "#141110" : ink;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M22 74 Q22 34 60 32 Q98 34 98 74 Z" fill={f} stroke={st} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M60 32 V74 M40 38 Q34 56 36 74 M80 38 Q86 56 84 74" stroke={dark ? "#3A3330" : "#BFB4A3"} strokeWidth="1.4" fill="none" />
      <circle cx="60" cy="33" r="2.6" fill={f} stroke={st} strokeWidth="1.4" />
      <path d="M12 76 Q60 64 108 76 Q102 90 60 86 Q18 90 12 76 Z" fill={f} stroke={st} strokeWidth="2.4" strokeLinejoin="round" />
      <g transform="translate(60 56)">
        <circle r="9" fill="#FFFDF9" stroke={ink} strokeWidth="1.2" />
        <path d="M-3 -8 C3 -9 8 -5 8 -1 C5 -3 1 -2 0 -5 C-2 -3 -4 -5 -3 -8 Z" fill="#F94E2B" />
        <circle cx="-3" cy="0" r=".9" fill={ink} /><circle cx="3" cy="0" r=".9" fill={ink} />
        <path d="M-9 1 l-4 -2 M9 1 l4 -2" stroke={ink} strokeWidth="1" />
      </g>
    </svg>
  );
}
