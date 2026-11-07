import * as THREE from "three";
import { PI, RM, canvasFilter, ctex, fontFamily, makeRenderer, mk, studioEnv } from "./common";
import type { MerchArt } from "../menu/types";

/* Merch en 3D construido en código: playeras, tote y gorras. Las prendas son siluetas con volumen (extrusión con bisel),
   subdivididas para doblar la tela con pliegues; la estampa es una calcomanía que sigue esos pliegues. Cuelgan de un gancho
   como péndulo amortiguado y la tela ondea con un shader; la gorra cae girando y queda en un tornamesa. */

interface Item { g: THREE.Group; hang: boolean; pivot: number }
type Spring = { x: number; v: number; to?: number };
const INK = "#27211E", RED = "#F2532F";

export class MerchEngine {
  readonly canvas: HTMLCanvasElement;
  private R: THREE.WebGLRenderer;
  private scene = new THREE.Scene(); private cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  private weave: THREE.Texture; private metal: THREE.MeshStandardMaterial;
  private UT = { value: 0 }; private UA = { value: 0 };
  private cache = new Map<MerchArt, Item>();
  private shadow: THREE.Mesh;
  private root = new THREE.Group(); private swingG = new THREE.Group(); private yawG = new THREE.Group(); private sizeG = new THREE.Group();
  private it: Item | null = null; private host: HTMLElement | null = null; private ro: ResizeObserver | null = null;
  private raf = 0; private t0 = 0; private drag = false; private lastX = 0; private yaw = 0; private yawV = 0; private idleT = 0;
  private center = new THREE.Vector3(); private fitH = 4; private fitW = 3;
  private drop: Spring = { x: 0, v: 0 }; private swing: Spring = { x: 0, v: 0 }; private scl: Spring = { x: 1, v: 0, to: 1 };
  private disposed = false;

  constructor(R: THREE.WebGLRenderer, canvas: HTMLCanvasElement) {
    this.R = R; this.canvas = canvas;
    canvas.className = "c3d"; canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "Producto en 3D. Arrastra para girarlo.");
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    this.scene.environment = studioEnv(R, 0.45, [[5, 9, [-8, 4, 6], 3, 0xffffff], [4, 10, [8, 3, 3], 2.2, 0xfff0dc], [12, 3, [0, 12, 0], 2, 0xffffff], [3, 8, [0, 3, -10], 1.4, 0xffe6c9]], 1);
    this.scene.add(new THREE.HemisphereLight(0xfff6ea, 0x7a5e48, 0.55 * PI));
    const key = new THREE.DirectionalLight(0xfff1df, 1.3 * PI); key.position.set(-4, 6, 7); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe0c0, 0.85 * PI); rim.position.set(5, 3, -6); this.scene.add(rim);
    const weave = ctex(mk(256, 256, (g, w, h) => { g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = (95 + Math.random() * 70) | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 2, 2); } if (canvasFilter()) { g.filter = "blur(.7px)"; g.drawImage(g.canvas, 0, 0); g.filter = "none"; } }), false, 8);
    weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(2.4, 2.4); this.weave = weave;
    this.metal = new THREE.MeshStandardMaterial({ color: 0xc9c3bb, metalness: 0.95, roughness: 0.28 });
    const shc = mk(256, 256, (g) => { const rg = g.createRadialGradient(128, 128, 8, 128, 128, 128); rg.addColorStop(0, "rgba(40,24,12,.42)"); rg.addColorStop(0.6, "rgba(40,24,12,.12)"); rg.addColorStop(1, "rgba(40,24,12,0)"); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ctex(shc, false), transparent: true, depthWrite: false })); this.shadow.rotation.x = -PI / 2; this.scene.add(this.shadow);
    this.root.add(this.swingG); this.swingG.add(this.yawG); this.yawG.add(this.sizeG); this.scene.add(this.root);
    canvas.addEventListener("pointerdown", (e) => { this.drag = true; this.lastX = e.clientX; this.yawV = 0; try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ } });
    canvas.addEventListener("pointermove", (e) => { if (!this.drag) return; const dx = e.clientX - this.lastX; this.lastX = e.clientX; this.yawV = dx * 0.012; this.yaw += this.yawV; if (this.it?.hang) this.swing.v += dx * 0.004; });
    const up = () => { this.drag = false; }; canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  }
  static create(): MerchEngine | null { const canvas = document.createElement("canvas"); const R = makeRenderer(canvas); return R ? new MerchEngine(R, canvas) : null; }

  // ---------- geometría de tela ----------
  private tess(g: THREE.BufferGeometry, maxL: number) {
    const P = g.attributes.position.array as Float32Array, U = g.attributes.uv.array as Float32Array, oP: number[] = [], oU: number[] = [], m2 = maxL * maxL, st: number[][][] = [];
    for (let i = 0; i < P.length / 9; i++) { const v = (k: number) => [P[i * 9 + k * 3], P[i * 9 + k * 3 + 1], P[i * 9 + k * 3 + 2], U[i * 6 + k * 2], U[i * 6 + k * 2 + 1]]; st.push([v(0), v(1), v(2)]); }
    const d2 = (a: number[], b: number[]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2, mid = (a: number[], b: number[]) => a.map((x, k) => (x + b[k]) / 2);
    while (st.length) { const t = st.pop()!, e = [d2(t[0], t[1]), d2(t[1], t[2]), d2(t[2], t[0])], k = e.indexOf(Math.max(e[0], e[1], e[2]));
      if (e[k] <= m2) { t.forEach((v) => { oP.push(v[0], v[1], v[2]); oU.push(v[3], v[4]); }); continue; }
      const a = t[k], b = t[(k + 1) % 3], c = t[(k + 2) % 3], m = mid(a, b); st.push([a, m, c], [m, b, c]); }
    const map = new Map<string, number>(), pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i < oP.length / 3; i++) { const key = Math.round(oP[i * 3] * 1e4) + "," + Math.round(oP[i * 3 + 1] * 1e4) + "," + Math.round(oP[i * 3 + 2] * 1e4); let j = map.get(key);
      if (j === undefined) { j = pos.length / 3; map.set(key, j); pos.push(oP[i * 3], oP[i * 3 + 1], oP[i * 3 + 2]); uv.push(oU[i * 2], oU[i * 2 + 1]); } idx.push(j); }
    const ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); ng.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); ng.setIndex(idx); return ng;
  }
  private cloth(shape: THREE.Shape, depth: number, bev: number, fold: (x: number, y: number) => number, puff: (x: number, y: number) => number, mat: THREE.Material) {
    let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.7, bevelSegments: 6, curveSegments: 28 }); g.translate(0, 0, -depth / 2);
    g = this.tess(g, 0.075); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setZ(i, z + fold(x, y) + Math.sign(z) * puff(x, y) * Math.min(1, Math.abs(z) / (depth / 2 + bev))); }
    g.computeVertexNormals(); return new THREE.Mesh(g, mat);
  }
  private bend(g: THREE.BufferGeometry, f: (x: number, y: number) => number) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + f(p.getX(i), p.getY(i))); g.computeVertexNormals(); return g; }
  private decal(cv: HTMLCanvasElement, w: number, h: number, cx: number, cy: number, zf: number, f: (x: number, y: number) => number, b: (x: number, y: number) => number, flt: (m: THREE.MeshStandardMaterial) => THREE.MeshStandardMaterial) {
    const g = new THREE.PlaneGeometry(w, h, 28, 28), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, y = p.getY(i) + cy; p.setXYZ(i, x, y, zf + f(x, y) + b(x, y) + 0.006); } g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ map: ctex(cv, true, 8), transparent: true, roughness: 0.78, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }); flt(m); const me = new THREE.Mesh(g, m); me.renderOrder = 2; return me;
  }
  private flutter(top: number, span: number) {
    return (m: THREE.MeshStandardMaterial) => { m.customProgramCacheKey = () => "cloth" + top + span;
      m.onBeforeCompile = (sh) => { sh.uniforms.uT = this.UT; sh.uniforms.uA = this.UA; sh.uniforms.uTop = { value: top }; sh.uniforms.uSpan = { value: span };
        sh.vertexShader = "uniform float uT;uniform float uA;uniform float uTop;uniform float uSpan;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      float hang=clamp((uTop-position.y)/uSpan,0.,1.);hang*=hang;
      transformed.z+=uA*hang*(sin(position.y*2.6-uT*2.2+position.x*.8)*.65+sin(position.x*3.3+uT*1.4)*.35);
      transformed.x+=uA*.35*hang*sin(uT*1.7+position.y*1.9);`); }; return m; };
  }
  private fabric(hex: string, f: (m: THREE.MeshStandardMaterial) => THREE.MeshStandardMaterial) { return f(new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.94, bumpMap: this.weave, bumpScale: 0.05, envMapIntensity: 0.55 })); }

  // ---------- dibujos para estampas y bordado ----------
  private mascot(c: CanvasRenderingContext2D, x: number, y: number, r: number, ink = INK) {
    c.save(); c.translate(x, y); c.lineWidth = r * 0.1; c.strokeStyle = ink; c.lineJoin = c.lineCap = "round"; c.fillStyle = "#FFFDF9";
    c.beginPath(); c.moveTo(-r * 0.24, -r * 0.94); c.quadraticCurveTo(-r * 0.05, -r * 1.36, 0, -r * 1.38); c.quadraticCurveTo(r * 0.05, -r * 1.36, r * 0.24, -r * 0.94); c.fill(); c.stroke();
    [-1, 1].forEach((sx) => { c.beginPath(); c.moveTo(sx * r * 0.86, r * 0.36); c.quadraticCurveTo(sx * r * 1.5, r * 0.12, sx * r * 1.78, r * 0.5); c.quadraticCurveTo(sx * r * 1.4, r * 0.86, sx * r * 0.86, r * 0.7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(sx * r * 0.92, r * 0.52); c.lineTo(sx * r * 1.42, r * 0.44); c.moveTo(sx * r * 0.92, r * 0.58); c.lineTo(sx * r * 1.36, r * 0.66); c.stroke(); });
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.save(); c.clip(); c.fillStyle = RED;
    c.beginPath(); c.moveTo(-r * 0.5, -r * 0.92); c.bezierCurveTo(-r * 0.1, -r * 1.15, r * 0.75, -r * 1.05, r * 0.7, -r * 0.45); c.bezierCurveTo(r * 0.66, -r * 0.12, r * 0.3, -r * 0.18, r * 0.22, -r * 0.36); c.bezierCurveTo(r * 0.05, -r * 0.08, -r * 0.42, -r * 0.12, -r * 0.46, -r * 0.42); c.bezierCurveTo(-r * 0.62, -r * 0.55, -r * 0.66, -r * 0.8, -r * 0.5, -r * 0.92); c.fill();
    c.beginPath(); c.ellipse(r * 0.98, -r * 0.05, r * 0.16, r * 0.42, 0.15, 0, 7); c.fill(); c.restore();
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
    c.fillStyle = ink; [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * r * 0.42, r * 0.22, r * 0.085, r * 0.115, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(sx * r * 0.42 + r * 0.025, r * 0.17, r * 0.028, 0, 7); c.fill(); c.fillStyle = ink; });
    c.lineWidth = r * 0.07; c.beginPath(); [-1, 1].forEach((sx) => { c.moveTo(sx * r * 0.2, r * 0.62); c.quadraticCurveTo(sx * r * 0.55, r * 0.7, sx * r * 0.6, r * 1.02); }); c.stroke(); c.restore();
  }
  private spaced(c: CanvasRenderingContext2D, t: string, x: number, y: number, sp: number) { const w = [...t].reduce((a, ch) => a + c.measureText(ch).width + sp, -sp); let cx = x - w / 2; c.textAlign = "left"; for (const ch of t) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + sp; } }
  private prints = {
    teeBlack: () => mk(1024, 1024, (c, w, h) => { c.fillStyle = "#EBD9B8"; this.mascot(c, w / 2, h * 0.27, h * 0.12, "#1F1B19"); c.textAlign = "center"; c.font = `400 ${h * 0.15}px ${fontFamily("--font-poster", "sans-serif")}`; c.fillText("KOI TEA", w / 2, h * 0.66);
      c.font = `500 ${h * 0.055}px ${fontFamily("--font-mono", "monospace")}`; this.spaced(c, "BOBA SHOP", w / 2, h * 0.77, h * 0.022); c.fillRect(w * 0.32, h * 0.82, w * 0.36, h * 0.008); }),
    teeCream: () => mk(1024, 1024, (c, w, h) => { c.save(); c.translate(w * 0.5, h * 0.47); const k = w / 50; c.scale(k, k); c.lineWidth = 1.4; c.strokeStyle = INK; c.lineCap = c.lineJoin = "round"; const S = (d: string) => c.stroke(new Path2D(d)), F = (d: string, col: string) => { c.fillStyle = col; c.fill(new Path2D(d)); };
      F("M-14 -18 L-11 4 L-1 4 L2 -18 Z", "#EFD9BE"); F("M-13.2 -12 L-11 4 L-1 4 L1.2 -12 Z", "#D9A97E"); S("M-14 -18 L-11 4 L-1 4 L2 -18 Z"); S("M-15 -18 H3"); S("M-3 -18 L1 -27");
      c.fillStyle = INK; [[-9, -1], [-5, 0], [-1, -1], [-7, -4], [-3, -4], [-6, 2], [-2.5, 2]].forEach((p) => { c.beginPath(); c.arc(p[0], p[1], 1.1, 0, 7); c.fill(); });
      S("M8 -24 l3 -2 l3 2 M14 -26 l3 -2 l3 2"); F("M7.5 -1 a5.5 3.6 0 1 0 11 0 a5.5 3.6 0 1 0 -11 0", "#E2482B"); S("M7.5 -1 a5.5 3.6 0 1 0 11 0 a5.5 3.6 0 1 0 -11 0");
      S("M8 -2 q-3 -4 -1 -6 M18 -2 q3 -4 1 -6 M9 2 l-3 2.5 M17 2 l3 2.5 M11 2.6 l-1 3 M15 2.6 l1 3"); c.fillStyle = INK; c.beginPath(); c.arc(11.5, -2, 0.7, 0, 7); c.arc(14.5, -2, 0.7, 0, 7); c.fill();
      c.strokeStyle = "#4F8F86"; S("M-18 11 q4.5 -3 9 0 t9 0 t9 0 t9 0 M-18 16 q4.5 -3 9 0 t9 0 t9 0 t9 0");
      c.fillStyle = INK; c.font = `500 3.6px ${fontFamily("--font-mono", "monospace")}`; this.spaced(c, "PEÑASCO, SON, MX", 1, 27, 0.3); c.restore(); }),
    tote: () => mk(1024, 1024, (c, w) => { const k = w / 68; c.save(); c.scale(k, k); c.translate(-26, -42); c.lineWidth = 1.4; c.strokeStyle = INK; c.lineJoin = c.lineCap = "round";
      const koi = (tx: number, ty: number, rot: number) => { c.save(); c.translate(tx, ty); c.rotate((rot * PI) / 180); const body = new Path2D("M0 -16 C7 -14 8 -2 5 6 C3 12 1 15 0 18 C-1 15 -3 12 -5 6 C-8 -2 -7 -14 0 -16 Z");
        c.fillStyle = "#FFFCF6"; c.fill(body); c.save(); c.clip(body); c.fillStyle = RED; c.beginPath(); c.ellipse(1.5, -9, 5.5, 4.2, 0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(-2.5, 4, 3, 4.5, -0.2, 0, 7); c.fill(); c.restore();
        c.stroke(body); c.fillStyle = "#FFFCF6"; const tail = new Path2D("M0 18 L-6 25 L0 22 L6 25 Z"); c.fill(tail); c.stroke(tail); c.stroke(new Path2D("M-6 -4 l-5 3 M6 -4 l5 3"));
        c.fillStyle = INK; c.beginPath(); c.arc(-2.2, -10, 0.9, 0, 7); c.arc(2.2, -10, 0.9, 0, 7); c.fill(); c.restore(); };
      koi(52, 77, -28); koi(69, 72, 152); c.strokeStyle = "rgba(79,143,134,.8)"; c.lineWidth = 1; c.stroke(new Path2D("M36 96 q3 -2 6 0 t6 0 M74 58 q3 -2 6 0 t6 0"));
      c.fillStyle = INK; c.font = `500 4px ${fontFamily("--font-mono", "monospace")}`; c.textAlign = "left"; this.spaced(c, "ROCKY POINT, MX", 60, 50, 0.35); c.font = `400 5.5px ${fontFamily("--font-poster", "sans-serif")}`; c.textAlign = "right"; c.fillText("KOI TEA", 89, 105); c.restore(); }),
  };
  private hook(y0: number, y1: number) { const pts = [new THREE.Vector3(0, y0, 0), new THREE.Vector3(0, y1 - 0.16, 0)]; for (let i = 0; i <= 14; i++) { const a = PI * (i / 14) * 1.25; pts.push(new THREE.Vector3(Math.sin(a) * 0.13, y1 + (1 - Math.cos(a)) * 0.13, 0)); }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 8, false), this.metal); }

  // ---------- modelos ----------
  private teeShape() { const s = new THREE.Shape(); s.moveTo(-0.86, -1.38); s.quadraticCurveTo(0, -1.44, 0.86, -1.38); s.lineTo(0.8, 0.58); s.lineTo(1.06, 0.4); s.quadraticCurveTo(1.25, 0.56, 1.42, 0.78); s.lineTo(0.8, 1.24);
    s.quadraticCurveTo(0.58, 1.32, 0.34, 1.36); s.quadraticCurveTo(0, 1.0, -0.34, 1.36); s.quadraticCurveTo(-0.58, 1.32, -0.8, 1.24); s.lineTo(-1.42, 0.78); s.quadraticCurveTo(-1.25, 0.56, -1.06, 0.4); s.lineTo(-0.8, 0.58); s.closePath(); return s; }
  private tee(dark: boolean): Item {
    const g = new THREE.Group(), flt = this.flutter(1.36, 2.8), col = dark ? "#24201E" : "#F2ECDF", dep = 0.08, bev = 0.13;
    const fold = (x: number, y: number) => 0.045 * Math.sin(x * 2.4 + y * 1.2) + 0.03 * Math.sin(y * 3.6 - x * 1.9 + 0.8) * Math.min(1, Math.max(0, (1.2 - y) / 1.6)) - 0.05 * x * x * 0.25;
    const puff = (x: number, y: number) => 0.07 * Math.max(0, 1 - (x / 0.9) ** 2) * Math.max(0, 1 - ((y + 0.05) / 1.45) ** 2);
    g.add(this.cloth(this.teeShape(), dep, bev, fold, puff, this.fabric(col, flt)));
    const ns = new THREE.Shape(); ns.moveTo(0.34, 1.36); ns.quadraticCurveTo(0, 1.0, -0.34, 1.36); ns.quadraticCurveTo(0, 1.27, 0.34, 1.36);
    g.add(new THREE.Mesh(this.bend(new THREE.ExtrudeGeometry(ns, { depth: 0.16, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, -0.13), fold), this.fabric(dark ? "#151312" : "#DDD4C3", flt)));
    const nc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.36, 1.35, 0.16), new THREE.Vector3(0, 0.99, 0.2), new THREE.Vector3(-0.36, 1.35, 0.16));
    g.add(new THREE.Mesh(this.bend(new THREE.TubeGeometry(nc, 40, 0.032, 8, false), fold), this.fabric(dark ? "#2E2926" : "#E6DECF", flt)));
    [-1, 1].forEach((sx) => { const sc = new THREE.LineCurve3(new THREE.Vector3(sx * 1.0, 0.46, 0.2), new THREE.Vector3(sx * 1.33, 0.82, 0.2)); g.add(new THREE.Mesh(this.bend(new THREE.TubeGeometry(sc, 8, 0.012, 6, false), fold), this.fabric(dark ? "#3A3431" : "#D3C9B7", flt))); });
    g.add(this.decal(this.prints[dark ? "teeBlack" : "teeCream"](), 1.12, 1.12, 0, 0.3, dep / 2 + bev, fold, puff, flt));
    const hc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.02, 1.14, -0.02), new THREE.Vector3(0, 1.66, -0.02), new THREE.Vector3(1.02, 1.14, -0.02));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hc, 40, 0.05, 10, false), new THREE.MeshStandardMaterial({ color: new THREE.Color("#C08A55"), roughness: 0.42, envMapIntensity: 0.8 })));
    g.add(this.hook(1.4, 1.86)); return { g, hang: true, pivot: 2.1 };
  }
  private tote(): Item {
    const g = new THREE.Group(), flt = this.flutter(1.05, 2.5), dep = 0.05, bev = 0.09;
    const s = new THREE.Shape(), w = 1.15, y0 = -1.45, y1 = 1.05, r = 0.12; s.moveTo(-w + r, y0); s.lineTo(w - r, y0); s.quadraticCurveTo(w, y0, w, y0 + r); s.lineTo(w - 0.04, y1); s.lineTo(-w + 0.04, y1); s.lineTo(-w, y0 + r); s.quadraticCurveTo(-w, y0, -w + r, y0);
    const fold = (x: number, y: number) => 0.035 * Math.sin(x * 1.9 + y * 0.8) + 0.025 * Math.sin(y * 3.1 - x * 1.2) - 0.03 * x * x * 0.3, puff = (x: number, y: number) => 0.1 * Math.max(0, 1 - (x / 1.2) ** 2) * Math.max(0, 1 - ((y + 0.2) / 1.3) ** 2);
    g.add(this.cloth(s, dep, bev, fold, puff, this.fabric("#EEE3CC", flt)));
    g.add(new THREE.Mesh(this.bend(new THREE.BoxGeometry(2.24, 0.1, 0.24, 24, 1, 1).translate(0, 1.0, 0), fold), this.fabric("#E2D5BB", flt)));
    g.add(this.decal(this.prints.tote(), 2.02, 2.02, 0, -0.22, dep / 2 + bev, fold, puff, flt));
    const hm = this.fabric("#D9CBB2", (m) => m); [1, -1].forEach((sz) => { const z = 0.17 * sz, pts = [[-0.52, 0.92, z], [-0.6, 1.5, z * 0.7], [-0.36, 1.98, z * 0.25], [0, 2.14, 0], [0.36, 1.98, z * 0.25], [0.6, 1.5, z * 0.7], [0.52, 0.92, z]].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.05, 10, false), hm)); });
    g.add(this.hook(2.12, 2.5)); return { g, hang: true, pivot: 2.74 };
  }
  private cap(dark: boolean): Item {
    const g = new THREE.Group(), col = dark ? "#26211F" : "#C4B59C";
    const ct = mk(1024, 512, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) { c.fillStyle = dark ? `rgba(255,255,255,${Math.random() * 0.05})` : `rgba(80,60,40,${Math.random() * 0.06})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
      c.strokeStyle = dark ? "rgba(255,255,255,.16)" : "rgba(70,52,34,.32)"; for (let i = 0; i < 6; i++) { const x = ((0.25 + i / 6) % 1) * w; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.lineWidth = 1.5; c.setLineDash([5, 5]); [-7, 7].forEach((o) => { c.beginPath(); c.moveTo(x + o, h * 0.05); c.lineTo(x + o, h); c.stroke(); }); c.setLineDash([]);
        const ex = ((0.25 + (i + 0.5) / 6) % 1) * w; c.fillStyle = dark ? "#3A3431" : "#BDB09C"; c.beginPath(); c.ellipse(ex, h * 0.3, 7, 13, 0, 0, 7); c.fill(); c.fillStyle = dark ? "#100E0D" : "#8E826F"; c.beginPath(); c.ellipse(ex, h * 0.3, 3, 6, 0, 0, 7); c.fill(); }
      c.setLineDash([6, 5]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, h * 0.93); c.lineTo(w, h * 0.93); c.stroke(); c.setLineDash([]);
      c.save(); c.translate(w * 0.25, h * 0.6); c.scale(0.5, 1); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 6; c.shadowOffsetY = 3; this.mascot(c, 0, 0, h * 0.13, dark ? "#14110F" : INK); c.restore(); });
    const cm = new THREE.MeshStandardMaterial({ map: ctex(ct, true, 8), roughness: 0.9, bumpMap: this.weave, bumpScale: 0.015, envMapIntensity: 0.6 });
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 36, 0, PI * 2, 0, PI / 2), cm); crown.scale.set(1, 0.84, 1.06); g.add(crown);
    const lin = new THREE.Mesh(new THREE.SphereGeometry(0.985, 48, 24, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(dark ? "#1A1716" : "#B9AD99"), roughness: 1, side: THREE.BackSide })); lin.scale.copy(crown.scale); g.add(lin);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 10), cm); btn.scale.y = 0.5; btn.position.y = 0.84; g.add(btn);
    const bs = new THREE.Shape(), A = 1.2; for (let i = 0; i <= 24; i++) { const a = -A + (2 * A * i) / 24; const x = Math.sin(a) * 1.0, z = Math.cos(a) * 1.06; if (i) bs.lineTo(x, z); else bs.moveTo(x, z); }
    for (let i = 24; i >= 0; i--) { const a = -A + (2 * A * i) / 24, f = Math.cos(a); bs.lineTo(Math.sin(a) * 1.02, Math.cos(a) * 1.06 + 0.7 * Math.pow(Math.max(0, f), 1.6)); }
    const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.02, bevelSegments: 3, curveSegments: 24 }); bg.rotateX(PI / 2);
    const bg2 = this.tess(bg, 0.06); { const p = bg2.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), zi = 1.06 * Math.sqrt(Math.max(0, 1 - Math.min(1, x * x))), d = Math.max(0, z - zi); p.setY(i, p.getY(i) - 0.2 * d * d - 0.26 * d * x * x); } bg2.computeVertexNormals(); }
    const brim = new THREE.Mesh(bg2, new THREE.MeshStandardMaterial({ color: new THREE.Color(dark ? "#26211F" : "#B9A98E"), roughness: 0.88, bumpMap: this.weave, bumpScale: 0.012, envMapIntensity: 0.6 })); brim.position.y = 0.03; g.add(brim);
    g.rotation.x = 0.18; return { g, hang: false, pivot: 0 };
  }
  private build(art: MerchArt): Item { switch (art) { case "teeBlack": return this.tee(true); case "teeCream": return this.tee(false); case "tote": return this.tote(); case "capBlack": return this.cap(true); default: return this.cap(false); } }

  // ---------- escena ----------
  private sp(o: Spring, to: number, k: number, c: number, dt: number) { o.v += (k * (to - o.x) - c * o.v) * dt; o.x += o.v * dt; }
  private frameCam = () => { if (!this.host) return; const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return; this.R.setSize(w, h, false); this.cam.aspect = w / h;
    const tf = Math.tan((this.cam.fov * PI) / 360), d = Math.max(this.fitH / (2 * tf), this.fitW / (2 * tf * this.cam.aspect)) * 1.12 + 1.2; this.cam.position.set(this.center.x, this.center.y + d * 0.16, this.center.z + d); this.cam.lookAt(this.center); this.cam.updateProjectionMatrix(); };
  show(art: MerchArt) {
    let it = this.cache.get(art); if (!it) { it = this.build(art); this.cache.set(art, it); }
    if (this.it) this.sizeG.remove(this.it.g); this.it = it; this.sizeG.add(it.g);
    it.g.position.y = -it.pivot; this.root.position.set(0, it.pivot, 0);
    this.yaw = 0; this.yawV = 0; this.swing.x = this.swing.v = 0; this.scl.x = 1; this.scl.to = 1; this.scl.v = 0; this.drop.x = this.drop.v = 0; this.idleT = 0; this.sizeG.scale.setScalar(1); this.swingG.rotation.set(0, 0, 0); this.yawG.rotation.set(0, 0, 0); this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.root); box.getCenter(this.center); const sz = box.getSize(new THREE.Vector3()); this.fitH = sz.y; this.fitW = sz.x;
    this.shadow.position.set(this.center.x, box.min.y - (it.hang ? 0.35 : 0.02), 0); this.shadow.scale.setScalar(sz.x * (it.hang ? 1.1 : 1.5)); (this.shadow.material as THREE.MeshBasicMaterial).opacity = it.hang ? 0.55 : 1;
    if (!RM()) { this.drop.x = it.hang ? 2.4 : 3.2; if (it.hang) this.swing.x = 0.32; else { this.yaw = -2.2; this.yawV = 0.075; } }
    this.frameCam(); this.start();
  }
  size(z: string) { this.scl.to = ({ S: 0.93, M: 1, L: 1.05, XL: 1.1 } as Record<string, number>)[z] ?? 1; this.scl.v += RM() ? 0 : 2.2; if (this.it?.hang && !RM()) this.swing.v += 0.5; }
  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.t0) / 1000) || 0.016; this.t0 = now; const t = now / 1000, it = this.it, rm = RM();
    if (it) { this.sp(this.drop, 0, it.hang ? 70 : 110, it.hang ? 9 : 10, dt); this.root.position.y = it.pivot + this.drop.x;
      this.sp(this.scl, this.scl.to ?? 1, 180, 13, dt); let sq = 0; if (!it.hang) sq = Math.max(-0.06, Math.min(0.09, -this.drop.v * 0.012)); this.sizeG.scale.set(this.scl.x * (1 + sq * 0.5), this.scl.x * (1 - sq), this.scl.x * (1 + sq * 0.5));
      if (this.drag) this.idleT = 0; else this.idleT += dt;
      if (it.hang) { this.sp(this.swing, 0, 7, 0.9, dt); this.swingG.rotation.z = this.swing.x + (rm ? 0 : Math.sin(t * 1.2) * 0.014); this.UT.value = t; this.UA.value = rm ? 0 : 0.03 + Math.min(0.07, Math.abs(this.swing.v) * 0.09 + Math.abs(this.yawV) * 0.4);
        if (!this.drag) { this.yaw += this.yawV; this.yawV *= 0.93; if (this.idleT > 1.4 && Math.abs(this.yawV) < 0.01) { const k = Math.round(this.yaw / (PI * 2)) * PI * 2; this.yaw += (k - this.yaw) * Math.min(1, dt * 2.2); } } }
      else { this.UA.value = 0; if (!this.drag) { this.yawV *= 0.95; this.yaw += this.yawV + (rm ? 0 : 0.42 * dt); } this.root.position.y += rm ? 0 : Math.sin(t * 1.6) * 0.03; }
      this.yawG.rotation.y = this.yaw;
      const lift = Math.max(0, this.root.position.y - it.pivot); (this.shadow.material as THREE.MeshBasicMaterial).opacity = (it.hang ? 0.55 : 1) * Math.max(0.25, 1 - lift * 0.25); }
    this.R.render(this.scene, this.cam); this.raf = requestAnimationFrame(this.frame);
  };
  private start() { cancelAnimationFrame(this.raf); this.t0 = performance.now(); this.raf = requestAnimationFrame(this.frame); }
  mount(el: HTMLElement) { this.host = el; if (this.canvas.parentNode !== el) el.appendChild(this.canvas); this.ro?.disconnect(); this.ro = new ResizeObserver(this.frameCam); this.ro.observe(el); this.frameCam(); }
  stop() { cancelAnimationFrame(this.raf); }
  dispose() { this.stop(); this.disposed = true; this.ro?.disconnect(); this.R.dispose(); }
}

let singleton: MerchEngine | null | undefined;
export function getMerch(): MerchEngine | null { if (singleton === undefined) singleton = MerchEngine.create(); return singleton; }
