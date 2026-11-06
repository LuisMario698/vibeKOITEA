"use client";
import { useEffect, useId, useRef } from "react";
import { BUBS, CUP, CUP_CLIP, FIN, HEAD, PATCH_A, PATCH_B, PEARLS, RAYS, WHISK, mirror } from "./koiPaths";
import { cn, reducedMotion } from "@/lib/utils";

type Props = {
  /** play: se dibuja al montar · done: aparece completo */
  mode?: "play" | "done";
  /** vida en reposo: flota, aletea, parpadea, burbujas */
  live?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/** La mascota de Koi Tea en SVG: un koi que bebe boba. Con `mode="play"` se dibuja trazo a trazo. */
export default function KoiMark({ mode = "done", live = false, className, style }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const s = ref.current;
    if (!s || mode !== "play") return;
    if (reducedMotion()) { s.classList.add("done"); return; }
    const raf = requestAnimationFrame(() => s.classList.add("play"));
    return () => cancelAnimationFrame(raf);
  }, [mode]);
  return (
    <svg ref={ref} className={cn("koi", mode === "done" && "done", live && "live", className)} style={style} viewBox="0 0 200 244" aria-hidden="true">
      <defs>
        <clipPath id={`kh${id}`}><path d={HEAD} /></clipPath>
        <clipPath id={`kc${id}`}><path d={CUP_CLIP} /></clipPath>
      </defs>
      <path className="fill" d="M64 184L72 232Q73 238 79 238H121Q127 238 128 232L136 184Z" fill="#FFFFFF" fillOpacity=".72" />
      <g clipPath={`url(#kc${id})`}>
        <g className="tea">
          <rect x="60" y="199" width="80" height="42" fill="#C99A78" />
          <path className="wave" d="M60 200Q70 196 80 200T100 200T120 200T140 200T160 200T180 200V206H60Z" fill="#DDB696" />
        </g>
        {BUBS.map((p, i) => (
          <circle key={i} className="bub" style={{ ["--i" as string]: i }} cx={p[0]} cy={p[1]} r="1.8" fill="none" stroke="#FFF7EE" strokeWidth="1" opacity="0" />
        ))}
      </g>
      {PEARLS.map((p, i) => (
        <g key={i} className="pearl" style={{ ["--i" as string]: i }}>
          <circle cx={p[0]} cy={p[1]} r="5" fill="#2A1A12" />
          <circle cx={p[0] - 1.6} cy={p[1] - 1.7} r="1.3" fill="#7A5A48" />
        </g>
      ))}
      <path className="st" pathLength={1} style={{ ["--d" as string]: ".55s" }} d={CUP} />
      <g className="lid">
        <path d="M62 177H138V184H62Z" fill="#FFFDF9" />
        <path d="M68 177Q100 160 132 177Z" fill="#FFFDF9" />
        <path fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" d="M60 177H140V184H60ZM68 177Q100 160 132 177" />
      </g>
      <g className="body">
        <g className="straw">
          <rect x="95.5" y="118" width="9" height="62" rx="1.5" fill="#F4ECE2" stroke="currentColor" strokeWidth="2.6" />
          <path d="M98.5 124V174" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <path className="fill" d="M87 40Q95 25 99 11Q104 25 114 39Z" fill="#FFFDF9" />
        <path className="st" pathLength={1} style={{ ["--d" as string]: ".15s" }} d="M87 40Q95 25 99 11Q104 25 114 39" />
        <g className="finL">
          <path className="fill" d={`${FIN}Z`} fill="#FFFDF9" />
          <path className="st" pathLength={1} style={{ ["--d" as string]: ".3s" }} d={FIN} />
          <path className="st th" pathLength={1} style={{ ["--d" as string]: ".55s" }} d={RAYS} />
        </g>
        <g className="finR">
          <path className="fill" d={`${mirror(FIN)}Z`} fill="#FFFDF9" />
          <path className="st" pathLength={1} style={{ ["--d" as string]: ".3s" }} d={mirror(FIN)} />
          <path className="st th" pathLength={1} style={{ ["--d" as string]: ".55s" }} d={mirror(RAYS)} />
        </g>
        <path d={HEAD} fill="#FFFDF9" />
        <g clipPath={`url(#kh${id})`}>
          <g className="patch" fill="#F2502E">
            <path d={PATCH_A} />
            <path d={PATCH_B} />
          </g>
        </g>
        <path className="st" pathLength={1} style={{ ["--d" as string]: "0s" }} d={HEAD} />
        <path className="st th" pathLength={1} style={{ ["--d" as string]: ".7s" }} d={WHISK} />
        <path className="st th" pathLength={1} style={{ ["--d" as string]: ".7s" }} d={mirror(WHISK)} />
        <g className="lids">
          <g className="eye"><ellipse cx="78" cy="104" rx="4.8" ry="5.8" fill="currentColor" /><circle cx="79.6" cy="101.8" r="1.5" fill="#fff" /></g>
          <g className="eye"><ellipse cx="122" cy="104" rx="4.8" ry="5.8" fill="currentColor" /><circle cx="123.6" cy="101.8" r="1.5" fill="#fff" /></g>
        </g>
      </g>
    </svg>
  );
}
