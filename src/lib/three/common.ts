import * as THREE from "three";

export const PI = Math.PI;
export const RM = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeBack = (t: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

let webgl: boolean | null = null;
export function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { webgl = false; }
  return webgl;
}

/** Canvas 2D auxiliar para pintar texturas. */
export function mk(w: number, h: number, fn: (g: CanvasRenderingContext2D, w: number, h: number) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  fn(c.getContext("2d")!, w, h);
  return c;
}

/** ¿El canvas 2D soporta `filter` (desenfoque)? Safari lo tiene desde la versión 18. */
let filterOk: boolean | null = null;
export function canvasFilter(): boolean {
  if (filterOk == null) { try { const g = document.createElement("canvas").getContext("2d"); filterOk = !!g && "filter" in g; } catch { filterOk = false; } }
  return filterOk;
}

export function ctex(c: HTMLCanvasElement, srgb = true, aniso = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

export function makeRenderer(canvas: HTMLCanvasElement, opts: THREE.WebGLRendererParameters = {}): THREE.WebGLRenderer | null {
  try {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", ...opts });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    return r;
  } catch { return null; }
}

/** Entorno de estudio: una caja gris cálida con paneles de luz, convertido a PMREM. */
export function studioEnv(r: THREE.WebGLRenderer, base: number, panels: Array<[number, number, [number, number, number], number, number]>, lookAtY: number): THREE.Texture {
  const pm = new THREE.PMREMGenerator(r);
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(base, base * 0.92, base * 0.82, THREE.LinearSRGBColorSpace), side: THREE.BackSide })));
  for (const [w, h, p, k, c] of panels) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...p); m.lookAt(0, lookAtY, 0); es.add(m);
  }
  const tex = pm.fromScene(es, 0.02).texture;
  pm.dispose();
  return tex;
}

/** Nombre real de la familia tipográfica detrás de una variable CSS de next/font (para dibujar en canvas). */
export function fontFamily(cssVar: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function disposeObject(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
    else mat?.dispose();
  });
}
