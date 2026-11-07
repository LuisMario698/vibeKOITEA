import * as THREE from "three";
import { PI, RM, canvasFilter, ctex, makeRenderer, mk } from "./common";

/* Estanque 3D con koi al estilo del logo: sombreado en tres tonos y contorno de tinta.
   Cada koi es una columna que sigue su propio recorrido; el cuerpo se curva y ondula hacia la cola.
   Se dibuja por capas (fondo → cada koi del más hondo al más alto → agua, hojas y flor) para que
   dos koi nunca se vean atravesados aunque se encimen. */

type Kind = "kohaku" | "sanke" | "hi" | "ogon";
interface Spec { kind: Kind; s: number; x: number; z: number; ang: number; spd: number; y: number }
interface Q { x: number; z: number; tx: number; tz: number; nx: number; nz: number }
interface Koi {
  o: Spec; s: number; L: number; V: number[][]; body: THREE.Mesh; hull: THREE.Mesh; fins: THREE.Mesh; F: number[][];
  eyes: THREE.Mesh[]; glints: THREE.Mesh[]; barbs: THREE.Mesh; sh: THREE.Mesh; hist: number[][]; scn: THREE.Scene; layer: number;
  x: number; z: number; ang: number; spd: number; base: number; y: number; y0: number; ph: number; ph0: number; wn: number; av: number;
  tdir: number; tRot: number; rot: number; calm: number; ate: number; nibble: number; chaseId: number; chaseT: number; chaseRot: number;
  fo: number[]; S: Float32Array; Sw: Float32Array; bp: Float32Array; beat: number; leaving: boolean;
}
interface Pellet { m: THREE.Mesh; x: number; z: number; t0: number; ph: number; state: number; ts: number }
interface Bub { sp: THREE.Sprite; x: number; z: number; y0: number; t0: number; dur: number }

const NU = 72, NV = 24, UMAX = 1.42, M = 80, RB = 0.2, L0 = 1.5, BN = 7;
const BX = 1.95, BZ = 1.35, ZMIN = -1.05, ZMAX = 1.25, EDGE = 0.7, RMIN = 0.36, WCAP = 0.8;
const fprof = (u: number) => { if (u <= 0) return 0; if (u < 0.3) return Math.pow(Math.sin((u / 0.3) * PI / 2), 0.5); const k = (u - 0.3) / 0.7; return Math.max(0.04, 1 - 0.95 * Math.pow(k, 1.3)); };
const rng = (seed: number) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const FIN_GRID: Array<[number, number, number, number]> = [[0, 0, 12, 8], [1, 0, 8, 4], [2, 1, 6, 6], [2, -1, 6, 6], [3, 1, 4, 4], [3, -1, 4, 4]];
const SPECS: Spec[] = [
  { kind: "kohaku", s: 1.35, x: -0.6, z: 0.1, ang: 0.3, spd: 0.36, y: -0.02 },
  { kind: "hi", s: 1.25, x: 0.9, z: 0.5, ang: 2.6, spd: 0.4, y: -0.52 },
  { kind: "ogon", s: 1.12, x: 0.2, z: -0.8, ang: -1.2, spd: 0.32, y: -0.04 },
];
const edge = (v: number, lo: number, hi: number) => (v < lo + EDGE ? ((lo + EDGE - v) / EDGE) ** 2 : v > hi - EDGE ? -(((v - (hi - EDGE)) / EDGE) ** 2) : 0);
const CAUST = `float caust(vec2 p,float t){vec2 q=p;float v=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.7+t+float(i)*1.3),cos(q.x*1.5-t*1.1+float(i)*2.1))*.45;v+=abs(sin(q.x*2.3)*cos(q.y*2.3));}v/=3.;return pow(1.-v,6.)*2.2;}`;

export class PondEngine {
  private R: THREE.WebGLRenderer;
  private scene = new THREE.Scene(); private top: THREE.Scene;
  private cam = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  private uT = { value: 0 };
  private INK = new THREE.Color(0x27211e);
  private GM: THREE.DataTexture;
  private rip = [0, 1, 2, 3].map(() => new THREE.Vector3(0, 0, -99)); private ri = 0;
  private shTex: THREE.Texture; private shGeo: THREE.PlaneGeometry;
  private pads: Array<{ m: THREE.Mesh; rot: number; ph: number }> = [];
  private flower = new THREE.Group();
  private ALL: Koi[] = []; private KOI: Koi[] = []; private ORDER: Koi[] = []; private NWANT = 0;
  private finCache = new Map<Kind, THREE.Texture>();
  private eyeGeo = new THREE.SphereGeometry(0.032, 14, 10); private eyeMat: THREE.MeshBasicMaterial;
  private glintGeo = new THREE.SphereGeometry(0.011, 8, 6); private glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  private barbMat: THREE.MeshBasicMaterial;
  private ANISO: number;
  private food: { x: number; z: number; until: number; id: number } | null = null; private foodId = 0; private BITES: Koi[] = [];
  private TQ: Q = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 }; private TQ2: Q = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 }; private Qv: Q = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  private pelletGeo = new THREE.SphereGeometry(0.075, 14, 10); private pelletMat: THREE.MeshToonMaterial; private PEL: Pellet[] = []; private BUBS: Bub[] = [];
  private bubTex: THREE.Texture;
  private ray = new THREE.Raycaster(); private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3); private hit = new THREE.Vector3();
  private raf = 0; private on = false; private vis = true; private t0 = 0; private nextDrip = 2;
  private io: IntersectionObserver; private ro: ResizeObserver;
  private disposed = false;
  onFeed: (() => void) | null = null;

  constructor(R: THREE.WebGLRenderer, private cv: HTMLCanvasElement, private host: HTMLElement) {
    this.R = R;
    R.toneMapping = THREE.NoToneMapping; R.setClearColor(0x7faa9a);
    const GM = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 195, 195, 195, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    GM.minFilter = GM.magFilter = THREE.NearestFilter; GM.generateMipmaps = false; GM.needsUpdate = true; this.GM = GM;
    this.eyeMat = new THREE.MeshBasicMaterial({ color: this.INK });
    this.barbMat = new THREE.MeshBasicMaterial({ color: this.INK, side: THREE.DoubleSide });
    this.ANISO = Math.min(8, R.capabilities.getMaxAnisotropy());
    this.koiLights(this.scene);
    this.top = this.koiLights(new THREE.Scene());
    // fondo: piedras planas con contorno y destellos de luz
    const pc = mk(512, 512, (g) => {
      g.fillStyle = "#7FAA9A"; g.fillRect(0, 0, 512, 512); const pal = ["#739E8E", "#8DB6A6", "#6C9686"];
      for (let i = 0; i < 70; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = 8 + Math.random() * 18, rot = Math.random() * 3, ry = r * (0.6 + Math.random() * 0.3);
        for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { if (x + ox < -30 || x + ox > 542 || y + oy < -30 || y + oy > 542) continue; g.save(); g.translate(x + ox, y + oy); g.rotate(rot); g.fillStyle = pal[i % pal.length]; g.beginPath(); g.ellipse(0, 0, r, ry, 0, 0, 7); g.fill(); g.lineWidth = 2.4; g.strokeStyle = "rgba(39,33,30,.22)"; g.stroke(); g.restore(); } }
    });
    // Sin espacio de color: el shader escribe los bytes tal cual (como el prototipo), así el fondo se ve del #7FAA9A de la marca.
    const pTex = ctex(pc, false); pTex.wrapS = pTex.wrapT = THREE.RepeatWrapping;
    // Más grande que el encuadre más vertical (fov 44) para que nunca asome el color de fondo por arriba.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), new THREE.ShaderMaterial({ uniforms: { map: { value: pTex }, uT: this.uT },
      vertexShader: `varying vec2 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `uniform sampler2D map;uniform float uT;varying vec2 vW;varying vec2 vUv;${CAUST}
      void main(){vec3 b=texture2D(map,vW*vec2(.22,-.275)).rgb;float c=caust(vW*1.1,uT*.5);float line=smoothstep(.42,.5,c)-smoothstep(.56,.66,c);vec3 col=mix(b,vec3(.9,.97,.92),clamp(line,0.,1.)*.6);
      float v=smoothstep(4.6,2.2,length(vW*vec2(.75,1.)));col=mix(col*.8,col,v);gl_FragColor=vec4(col,1.);}` }));
    floor.rotation.x = -PI / 2; floor.position.y = -0.85; this.scene.add(floor);
    // superficie
    const water = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: this.uT, uRip: { value: this.rip } },
      vertexShader: `varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `uniform float uT;uniform vec3 uRip[4];varying vec2 vW;
      void main(){vec2 p=vW*1.3;float s=sin(p.x*2.6+uT*.7+sin(p.y*1.8+uT*.4))*sin(p.y*3.1-uT*.5+sin(p.x*1.5));float a=smoothstep(.955,.97,s)*.55;
      for(int i=0;i<4;i++){float age=uT-uRip[i].z;if(age>0.&&age<2.6){float d=distance(vW,uRip[i].xy);float f=1.-age/2.6;
        a+=(smoothstep(.035,.0,abs(d-age*.7))*.9+smoothstep(.028,.0,abs(d-age*.45))*.6)*f;}}
      gl_FragColor=vec4(1.,1.,.98,min(a,.9));}` }));
    water.rotation.x = -PI / 2; water.position.y = 0.3; water.renderOrder = 20; this.top.add(water);
    // sombras planas
    const shc = mk(256, 128, (g) => {
      if (canvasFilter()) { g.filter = "blur(6px)"; g.fillStyle = "rgba(30,70,58,1)"; g.beginPath(); g.ellipse(128, 64, 112, 46, 0, 0, 7); g.fill(); return; }
      // sin `filter` (Safari < 18): borde suave con un degradado radial
      g.translate(128, 64); g.scale(1, 46 / 112); const rg = g.createRadialGradient(0, 0, 0, 0, 0, 120);
      rg.addColorStop(0, "rgba(30,70,58,1)"); rg.addColorStop(0.86, "rgba(30,70,58,1)"); rg.addColorStop(1, "rgba(30,70,58,0)"); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill();
    });
    this.shTex = ctex(shc); this.shGeo = new THREE.PlaneGeometry(1, 1); this.shGeo.rotateX(-PI / 2);
    // hojas de loto y flor
    const lc = mk(256, 256, (g) => {
      const cut = 0.25, R0 = 118, c = 128, pt = (a: number): [number, number] => [c + Math.cos(a) * R0, c - Math.sin(a) * R0];
      g.beginPath(); g.moveTo(c, c); g.lineTo(...pt(cut)); g.arc(c, c, R0, -cut, -(PI * 2 - cut), true); g.closePath();
      g.fillStyle = "#6FB06A"; g.fill(); g.save(); g.clip(); g.fillStyle = "#86C27D"; g.beginPath(); g.arc(c - 26, c - 30, 70, 0, 7); g.fill(); g.restore();
      g.strokeStyle = "rgba(39,33,30,.35)"; g.lineWidth = 2.5; for (let i = 1; i < 10; i++) { const a = cut + (i / 10) * (PI * 2 - cut * 2); g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * R0 * 0.78, c - Math.sin(a) * R0 * 0.78); g.stroke(); }
      g.beginPath(); g.moveTo(c, c); g.lineTo(...pt(cut)); g.arc(c, c, R0, -cut, -(PI * 2 - cut), true); g.closePath(); g.lineWidth = 7; g.strokeStyle = "#27211E"; g.stroke();
    });
    const padMat = new THREE.MeshBasicMaterial({ map: ctex(lc), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    ([[1.55, -0.85, 0.48, 0.3], [-1.75, 0.95, 0.38, 2.1], [-1.25, -1.1, 0.3, 4], [1.9, 0.75, 0.26, 1.2]] as const).forEach(([x, z, r, rot], i) => {
      const g = new THREE.PlaneGeometry(r * 2.17, r * 2.17); g.rotateX(-PI / 2); const m = new THREE.Mesh(g, padMat); m.position.set(x, 0.32, z); m.rotation.y = rot; m.renderOrder = 21; this.top.add(m);
      const sh = this.shadowMesh(); sh.position.set(x + 0.22, -0.83, z + 0.3); sh.scale.set(r * 2.4, 1, r * 2.4); (sh.material as THREE.MeshBasicMaterial).opacity = 0.22; this.pads.push({ m, rot, ph: i * 1.7 });
    });
    const petal = new THREE.SphereGeometry(1, 14, 10);
    ([[0xf6a9bf, 10, 0.11, 0.32], [0xfbd3df, 7, 0.08, 0.62]] as const).forEach(([c, n, len, tilt], li) => { const mat = this.toon({ color: c }); for (let i = 0; i < n; i++) { const m = new THREE.Mesh(petal, mat); m.scale.set(0.035, 0.018, len); const a = (i / n) * PI * 2 + li * 0.3; m.position.set(Math.sin(a) * len * 0.8, 0.03 + li * 0.03, Math.cos(a) * len * 0.8); m.rotation.set(0, a, 0); m.rotateX(-tilt); this.flower.add(m); } });
    const ctr = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), this.toon({ color: 0xf2c94c })); ctr.position.y = 0.07; this.flower.add(ctr);
    this.flower.position.set(1.62, 0.34, -0.9); this.top.add(this.flower);
    this.pelletMat = this.toon({ color: 0xd08a3e });
    this.bubTex = ctex(mk(64, 64, (g) => { g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fillStyle = "rgba(255,255,255,.5)"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#27211E"; g.stroke(); g.beginPath(); g.arc(24, 23, 6, 0, 7); g.fillStyle = "#fff"; g.fill(); }));
    this.ALL = SPECS.map((o, i) => this.makeKoi(o, i + 1));
    cv.addEventListener("pointerdown", this.onDown); cv.addEventListener("pointerup", this.onUp); cv.addEventListener("pointercancel", this.onCancel);
    this.ro = new ResizeObserver(() => this.size()); this.ro.observe(host);
    this.io = new IntersectionObserver((es) => { this.vis = es[0].isIntersecting; if (this.vis && this.on) { cancelAnimationFrame(this.raf); this.t0 = performance.now(); this.raf = requestAnimationFrame(this.frame); } });
    this.io.observe(host);
    this.setCount(3);
  }

  static create(cv: HTMLCanvasElement, host: HTMLElement): PondEngine | null {
    const R = makeRenderer(cv, { alpha: false });
    if (!R) return null;
    return new PondEngine(R, cv, host);
  }

  private koiLights(sc: THREE.Scene) { sc.add(new THREE.HemisphereLight(0xffffff, 0xc9ded6, 0.5 * PI)); const d = new THREE.DirectionalLight(0xffffff, 0.62 * PI); d.position.set(2.5, 7, 2); sc.add(d); return sc; }
  private toon(o: { color: number | THREE.Color; map?: THREE.Texture }) { return new THREE.MeshToonMaterial({ gradientMap: this.GM, ...o }); }
  private outlineMat(w: number) {
    const m = new THREE.MeshBasicMaterial({ color: this.INK, side: THREE.BackSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uOut = { value: w }; sh.vertexShader = "uniform float uOut;\nattribute float aOut;\n" + sh.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = position + normal * uOut * aOut;"); };
    return m;
  }
  private shadowMesh() { const m = new THREE.Mesh(this.shGeo, new THREE.MeshBasicMaterial({ map: this.shTex, transparent: true, depthWrite: false, opacity: 0.3 })); m.position.y = -0.83; m.renderOrder = 1; this.scene.add(m); return m; }
  ripple(x: number, z: number) { this.rip[this.ri % 4].set(x, z, this.uT.value); this.ri++; }

  /** Piel: colores planos del logo + escamas, agalla, línea lateral, fosas nasales y labios. */
  private bodyTex(kind: Kind, seed: number) {
    const W = 1024, H = 512, rnd = rng(seed * 7919 + 13);
    const c = mk(W, H, (g) => {
      const pal = { kohaku: ["#FFFDF9", "#FFFDF9"], sanke: ["#FFFDF9", "#FFFDF9"], hi: ["#F7863C", "#FFE3C8"], ogon: ["#F4C552", "#FFF0C4"] }[kind];
      g.fillStyle = pal[0]; g.fillRect(0, 0, W, H); g.fillStyle = pal[1]; g.fillRect(0, H * 0.35, W, H * 0.3);
      const blob = (x: number, y: number, r: number, ry: number, col: string) => { g.fillStyle = col; [0, -H, H].forEach((o) => { g.beginPath(); for (let i = 0; i <= 36; i++) { const a = (i / 36) * PI * 2, k = 1 + 0.13 * Math.sin(a * 3 + x * 0.013 + seed) + 0.06 * Math.sin(a * 5 + y * 0.021); g.lineTo(x + Math.cos(a) * r * k, y + o + Math.sin(a) * ry * k); } g.closePath(); g.fill(); }); };
      const top = () => (rnd() < 0.5 ? 0 : H);
      if (kind === "kohaku" || kind === "sanke") {
        blob(80 + rnd() * 40, 0, 95 + rnd() * 30, 80 + rnd() * 25, "#F94E2B");
        let x = 300 + rnd() * 50;
        for (let i = 0; i < 3 && x < 900; i++) { const r = 75 + rnd() * 55; blob(x + r * 0.4, top() + (rnd() - 0.5) * 50, r, 90 + rnd() * 35, "#F94E2B"); x += r * 2 + 60 + rnd() * 90; }
        if (kind === "sanke") for (let i = 0; i < 6; i++) blob(240 + rnd() * 620, top() + (rnd() - 0.5) * 120, 16 + rnd() * 20, 12 + rnd() * 16, "#27211E");
      }
      if (kind === "hi") for (let i = 0; i < 4; i++) blob(120 + rnd() * 760, top() + (rnd() - 0.5) * 80, 50 + rnd() * 50, 40 + rnd() * 40, "#E35A26");
      if (kind === "ogon") blob(90, 0, 110, 90, "#F7D47A");
      const sx = 30, sy = 26;
      for (let col = 0, x = 222; x < W + sx; x += sx * 0.82, col++) for (let y = -sy; y < H + sy; y += sy) {
        const yy = y + (col % 2 ? sy / 2 : 0), vb = Math.abs(yy / H - 0.5); if (vb < 0.16) continue; const r = sx * 0.6;
        if (kind === "ogon") { g.fillStyle = "rgba(255,251,228,.38)"; g.beginPath(); g.arc(x, yy, r * 0.78, -PI / 2, PI / 2); g.fill(); }
        if (kind === "hi" && vb > 0.24) { const band = Math.sin(x * 0.011 + seed) * Math.cos(yy * 0.028 + seed * 0.7); if (band > 0.2) { g.fillStyle = "rgba(47,143,138,.8)"; g.beginPath(); g.arc(x, yy, r * 0.82, -PI / 2, PI / 2); g.fill(); } }
        g.strokeStyle = kind === "hi" ? "rgba(110,34,8,.32)" : kind === "ogon" ? "rgba(150,100,20,.34)" : "rgba(39,33,30,.14)"; g.lineWidth = 2.4;
        g.beginPath(); g.arc(x, yy, r, -PI / 2, PI / 2); g.stroke();
      }
      g.fillStyle = "rgba(39,33,30,.22)"; for (let x = 240; x < 930; x += 15) [0.25, 0.75].forEach((v) => { g.beginPath(); g.arc(x, H * v + Math.sin(x * 0.02) * 3, 2.3, 0, 7); g.fill(); });
      g.strokeStyle = "rgba(39,33,30,.62)"; g.lineWidth = 4.5; g.lineCap = "round";
      ([[0.05, 0.45], [0.55, 0.95]] as const).forEach(([a, b]) => { g.beginPath(); g.moveTo(208, H * a); g.quadraticCurveTo(262, (H * (a + b)) / 2, 208, H * b); g.stroke(); });
      g.fillStyle = "rgba(39,33,30,.7)"; ([[44, H * 0.075], [44, H * 0.925]] as const).forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 5.5, 3.6, 0, 0, 7); g.fill(); });
      g.fillStyle = "#F2B3A3"; g.fillRect(0, 0, 14, H);
    });
    return ctex(c, true, this.ANISO);
  }
  /** Aletas: cola en abanico, dorsal, pectorales y pélvicas, con franja translúcida, radios y borde ondulado. */
  private finTex(kind: Kind) {
    const hit = this.finCache.get(kind); if (hit) return hit;
    const S = 256;
    const c = mk(S * 4, S, (g) => {
      const pal = { kohaku: ["#FFFDF9", "#DCEDE6"], sanke: ["#FFFDF9", "#DCEDE6"], hi: ["#F7863C", "#FBC59E"], ogon: ["#F4C552", "#F9E7B4"] }[kind];
      const Lp = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      type P = { m: (p: number[]) => void; l: (p: number[]) => void; q: (c1: number[], p: number[]) => void; sc: (a: number[], b: number[], n: number) => void };
      const FINS: Array<{ path: (P: P) => void; band: [number, string]; from?: number[]; n: number; to?: (i: number) => number[]; seg?: (i: number) => number[][] }> = [
        { path(P) { P.m([0, 0.4]); P.q([0.3, 0.3], [0.58, 0.13]); P.q([0.8, 0.02], [1, 0.03]); P.sc([1, 0.03], [0.76, 0.5], 4); P.sc([0.76, 0.5], [1, 0.97], 4); P.q([0.8, 0.98], [0.58, 0.87]); P.q([0.3, 0.7], [0, 0.6]); }, band: [0.46, "s"], from: [0.02, 0.5], n: 13, to: (i) => { const t = i / 12; return t < 0.5 ? Lp([1, 0.03], [0.76, 0.5], t * 2) : Lp([0.76, 0.5], [1, 0.97], (t - 0.5) * 2); } },
        { path(P) { P.m([0, 0]); P.l([0, 0.12]); P.q([0.02, 0.72], [0.12, 0.93]); P.sc([0.12, 0.93], [1, 0.3], 6); P.l([1, 0]); }, band: [0.5, "t"], n: 9, seg: (i) => { const s = 0.06 + i * 0.105, e = Math.min(1, s + 0.16); return [[s, 0], [e, 0.93 - 0.63 * Math.max(0, (e - 0.12) / 0.88)]]; } },
        { path(P) { P.m([0, 0.28]); P.q([0.45, 0.02], [0.82, 0.12]); P.sc([0.82, 0.12], [1, 0.5], 3); P.sc([1, 0.5], [0.82, 0.88], 3); P.q([0.45, 0.98], [0, 0.72]); }, band: [0.52, "s"], from: [0.02, 0.5], n: 9, to: (i) => { const t = i / 8; return t < 0.5 ? Lp([0.82, 0.12], [1, 0.5], t * 2) : Lp([1, 0.5], [0.82, 0.88], (t - 0.5) * 2); } },
        { path(P) { P.m([0, 0.32]); P.q([0.5, 0.12], [0.85, 0.24]); P.sc([0.85, 0.24], [1, 0.5], 2); P.sc([1, 0.5], [0.85, 0.76], 2); P.q([0.5, 0.88], [0, 0.68]); }, band: [0.55, "s"], from: [0.02, 0.5], n: 6, to: (i) => { const t = i / 5; return t < 0.5 ? Lp([0.85, 0.24], [1, 0.5], t * 2) : Lp([1, 0.5], [0.85, 0.76], (t - 0.5) * 2); } },
      ];
      FINS.forEach((f, i) => {
        const ox = i * S, X = (s: number) => ox + (0.05 + s * 0.9) * S, Y = (t: number) => (0.05 + (1 - t) * 0.9) * S;
        const P: P = { m: (p) => g.moveTo(X(p[0]), Y(p[1])), l: (p) => g.lineTo(X(p[0]), Y(p[1])), q: (c1, p) => g.quadraticCurveTo(X(c1[0]), Y(c1[1]), X(p[0]), Y(p[1])),
          sc: (a, b, n) => { const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); let px = dy / len, py = -dx / len; if (px < 0 || (px === 0 && py < 0)) { px = -px; py = -py; }
            for (let k = 1; k <= n; k++) { const p0 = Lp(a, b, (k - 1) / n), p1 = Lp(a, b, k / n), mx = (p0[0] + p1[0]) / 2 + (px * len) / n * 0.38, my = (p0[1] + p1[1]) / 2 + (py * len) / n * 0.38; g.quadraticCurveTo(X(mx), Y(my), X(p1[0]), Y(p1[1])); } } };
        g.save(); g.beginPath(); f.path(P); g.closePath(); g.clip();
        g.fillStyle = pal[0]; g.fillRect(ox, 0, S, S);
        g.fillStyle = pal[1]; if (f.band[1] === "s") g.fillRect(X(f.band[0]), 0, ox + S - X(f.band[0]), S); else g.fillRect(ox, 0, S, Y(f.band[0]));
        if (kind === "hi" && i === 0) { g.fillStyle = "rgba(47,143,138,.4)"; g.fillRect(ox, 0, X(0.22) - ox, S); }
        g.strokeStyle = "rgba(39,33,30,.38)"; g.lineWidth = 2.6; g.lineCap = "round";
        for (let r = 0; r < f.n; r++) { const [a, b] = f.seg ? f.seg(r) : [f.from!, f.to!(r)]; g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.quadraticCurveTo(X((a[0] + b[0]) / 2 + 0.04), Y((a[1] + b[1]) / 2), X(b[0]), Y(b[1])); g.stroke(); }
        if (kind === "sanke" && i === 2) { g.strokeStyle = "#27211E"; g.lineWidth = 10; [3, 5].forEach((r) => { const b = f.to!(r); g.beginPath(); g.moveTo(X(0.03), Y(0.5)); g.lineTo(X(b[0] * 0.92), Y(b[1])); g.stroke(); }); }
        g.restore();
        g.beginPath(); f.path(P); g.closePath(); g.lineWidth = 7; g.lineJoin = "round"; g.strokeStyle = "#27211E"; g.stroke();
      });
    });
    const t = ctex(c, true, this.ANISO); this.finCache.set(kind, t); return t;
  }

  private makeKoi(o: Spec, seed: number): Koi {
    const s = o.s, L = L0 * s;
    const nV = (NU + 1) * (NV + 1), pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2), thick = new Float32Array(nV), V: number[][] = [], idx: number[] = [];
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const u = i / NU, th = (j / NV) * PI * 2, f = fprof(u), sa = Math.sin(th), ca = Math.cos(th); V.push([u, sa, ca, RB * f * s, RB * f * s * (ca < 0 ? 0.84 : 1)]); const q = V.length - 1; uv[q * 2] = u; uv[q * 2 + 1] = 1 - j / NV; thick[q] = Math.min(1, Math.max(0.22, f / 0.45)); }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); bg.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); bg.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); bg.setAttribute("aOut", new THREE.BufferAttribute(thick, 1)); bg.setIndex(idx);
    const deep = o.y < -0.25, ksn = this.koiLights(new THREE.Scene());
    const body = new THREE.Mesh(bg, this.toon(deep ? { map: this.bodyTex(o.kind, seed), color: 0xc4dcd3 } : { map: this.bodyTex(o.kind, seed), color: 0xffffff })); body.frustumCulled = false; body.renderOrder = 5; ksn.add(body);
    const hull = new THREE.Mesh(bg, this.outlineMat(0.026 * s)); hull.frustumCulled = false; hull.renderOrder = 4; ksn.add(hull);
    const F: number[][] = [], fuv: number[] = [], fidx: number[] = [];
    FIN_GRID.forEach(([type, side, ns, nt]) => { const base = F.length; for (let a = 0; a <= ns; a++) for (let b = 0; b <= nt; b++) { const ss = a / ns, tt = b / nt; F.push([type, side, ss, tt]); fuv.push((type + 0.01 + ss * 0.98) / 4, tt); }
      for (let a = 0; a < ns; a++) for (let b = 0; b < nt; b++) { const p = base + a * (nt + 1) + b, q = p + nt + 1; fidx.push(p, q, p + 1, q, q + 1, p + 1); } });
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(F.length * 3), 3)); fg.setAttribute("uv", new THREE.Float32BufferAttribute(fuv, 2)); fg.setIndex(fidx);
    const fins = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ map: this.finTex(o.kind), color: deep ? 0xc4dcd3 : 0xffffff, alphaTest: 0.5, side: THREE.DoubleSide })); fins.frustumCulled = false; fins.renderOrder = 6; ksn.add(fins);
    const eyes = [0, 1].map(() => { const e = new THREE.Mesh(this.eyeGeo, this.eyeMat); e.scale.setScalar(s); ksn.add(e); return e; });
    const glints = [0, 1].map(() => { const e = new THREE.Mesh(this.glintGeo, this.glintMat); e.scale.setScalar(s); e.renderOrder = 7; ksn.add(e); return e; });
    const bidx: number[] = []; for (let sd = 0; sd < 2; sd++) for (let j = 0; j < BN - 1; j++) { const p = (sd * BN + j) * 2; bidx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
    const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * BN * 2 * 3), 3)); bgeo.setIndex(bidx);
    const barbs = new THREE.Mesh(bgeo, this.barbMat); barbs.frustumCulled = false; barbs.renderOrder = 6; ksn.add(barbs);
    const sh = this.shadowMesh();
    const hist: number[][] = []; for (let n = 0; n < 160; n++) hist.push([o.x - Math.cos(o.ang) * n * 0.02, o.z - Math.sin(o.ang) * n * 0.02]);
    return { o, s, L, V, body, hull, fins, F, eyes, glints, barbs, sh, hist, scn: ksn, layer: deep ? 0 : 1, x: o.x, z: o.z, ang: o.ang, spd: o.spd, base: o.spd, y: o.y, y0: o.y, ph: seed * 1.7, ph0: seed * 2.3, wn: 0, av: 0, tdir: 0, tRot: 0, rot: 0, calm: 0, ate: -1, nibble: 0, chaseId: -1, chaseT: 0, chaseRot: 0, fo: [0, 0], S: new Float32Array((M + 1) * 2), Sw: new Float32Array((M + 1) * 4), bp: new Float32Array(BN * 2), beat: 0.5, leaving: false };
  }

  private draw() { const R = this.R; R.autoClear = false; R.clear(); R.render(this.scene, this.cam); for (const k of this.ORDER) { R.clearDepth(); R.render(k.scn, this.cam); } R.clearDepth(); R.render(this.top, this.cam); }
  private showKoi(k: Koi, v: boolean) { [k.body, k.hull, k.fins, k.sh, k.barbs, ...k.eyes, ...k.glints].forEach((m) => { m.visible = v; }); }

  /** De 1 a 3 koi; los que sobran se van nadando por la orilla y los nuevos entran por un borde. */
  setCount(n: number): number {
    n = Math.max(1, Math.min(this.ALL.length, n | 0)); this.NWANT = n;
    this.ALL.forEach((k, i) => {
      const keep = i < n, inPond = this.KOI.includes(k);
      if (keep) {
        if (k.leaving) k.leaving = false;
        else if (!inPond) { this.showKoi(k, true);
          if (this.KOI.length) { const side = Math.random() < 0.5 ? -1 : 1; k.x = side * (BX + 0.9); k.z = (ZMIN + ZMAX) / 2 + (Math.random() * 2 - 1) * (ZMAX - ZMIN) * 0.3; k.ang = side > 0 ? PI : 0; k.hist.length = 0;
            for (let q = 0; q < 160; q++) k.hist.push([k.x - Math.cos(k.ang) * q * 0.02, k.z - Math.sin(k.ang) * q * 0.02]); k.av = 0; k.wn = 0; k.spd = k.base; } }
      } else if (inPond && this.on && !RM()) k.leaving = true;
      else { k.leaving = false; this.showKoi(k, false); }
    });
    this.KOI = this.ALL.filter((k, i) => i < n || k.leaving);
    this.ORDER = this.KOI.slice().sort((a, b) => a.y0 - b.y0 || this.ALL.indexOf(a) - this.ALL.indexOf(b));
    this.KOI.forEach((k, i) => { const a = (i / n) * PI * 2 + 0.4; k.fo = [Math.cos(a) * 0.62, Math.sin(a) * 0.62]; });
    if (RM() || !this.on) { this.KOI.forEach((k) => this.pose(k)); this.draw(); } else this.KOI.forEach((k) => this.spine(k));
    return n;
  }
  count() { return this.NWANT; }
  get max() { return this.ALL.length; }

  private spine(k: Koi) {
    const S = k.S, H = k.hist; let i = 0, acc = 0;
    for (let m = 0; m <= M; m++) { const d = (m / M) * UMAX * k.L; let placed = false;
      while (i < H.length - 1) { const p = H[i], q = H[i + 1], sl = Math.hypot(q[0] - p[0], q[1] - p[1]); if (acc + sl >= d) { const r = sl > 0 ? (d - acc) / sl : 0; S[m * 2] = p[0] + (q[0] - p[0]) * r; S[m * 2 + 1] = p[1] + (q[1] - p[1]) * r; placed = true; break; } acc += sl; i++; }
      if (!placed) { const a = H[H.length - 1], b = H[H.length - 2] || [a[0] + 0.01, a[1]]; const dx = a[0] - b[0], dz = a[1] - b[1], l = Math.hypot(dx, dz) || 1; S[m * 2] = a[0] + (dx / l) * (d - acc); S[m * 2 + 1] = a[1] + (dz / l) * (d - acc); } }
    const W = k.Sw, amp = 0.075 * k.s * (0.6 + 0.4 * k.beat);
    for (let m = 0; m <= M; m++) { const a = Math.max(0, m - 1), b = Math.min(M, m + 1); let tx = S[a * 2] - S[b * 2], tz = S[a * 2 + 1] - S[b * 2 + 1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const u = (m / M) * UMAX; const off = amp * Math.pow(Math.min(u, 1.15), 1.6) * Math.sin(k.ph - u * 5.2); W[m * 4] = S[m * 2] + tz * off; W[m * 4 + 1] = S[m * 2 + 1] - tx * off; }
    for (let m = 0; m <= M; m++) { const a = Math.max(0, m - 1), b = Math.min(M, m + 1); const tx = W[a * 4] - W[b * 4], tz = W[a * 4 + 1] - W[b * 4 + 1]; const l = Math.hypot(tx, tz) || 1; W[m * 4 + 2] = tx / l; W[m * 4 + 3] = tz / l; }
  }
  private at(k: Koi, u: number, out: Q) { const W = k.Sw, f = Math.min(M - 1e-4, Math.max(0, (u / UMAX) * M)), m = Math.floor(f), r = f - m, a = m * 4, b = a + 4;
    out.x = W[a] + (W[b] - W[a]) * r; out.z = W[a + 1] + (W[b + 1] - W[a + 1]) * r; out.tx = W[a + 2] + (W[b + 2] - W[a + 2]) * r; out.tz = W[a + 3] + (W[b + 3] - W[a + 3]) * r; out.nx = out.tz; out.nz = -out.tx; return out; }

  private pose(k: Koi) {
    this.spine(k); const Q = this.Qv;
    const P = k.body.geometry.attributes.position.array as Float32Array, N = k.body.geometry.attributes.normal.array as Float32Array;
    k.V.forEach((v, q) => { const [u, sa, ca, w, h] = v; this.at(k, u, Q); const a = w * sa, b = h * ca; P[q * 3] = Q.x + Q.nx * a; P[q * 3 + 1] = k.y + b; P[q * 3 + 2] = Q.z + Q.nz * a;
      let nx = Q.nx * sa * h, ny = ca * w, nz = Q.nz * sa * h, l = Math.hypot(nx, ny, nz); if (l < 1e-6) { nx = Q.tx; ny = 0; nz = Q.tz; l = 1; } N[q * 3] = nx / l; N[q * 3 + 1] = ny / l; N[q * 3 + 2] = nz / l; });
    k.body.geometry.attributes.position.needsUpdate = true; k.body.geometry.attributes.normal.needsUpdate = true;
    const FP = k.fins.geometry.attributes.position.array as Float32Array, s = k.s, R0 = RB * s;
    const lean = 0.38 * Math.sin(k.ph * 0.5);
    k.F.forEach((f, q) => { const [type, side, ss, tt] = f; let u: number, a: number, b: number;
      if (type === 0) { const x = tt * 2 - 1, hw = s * (0.035 + 0.27 * Math.pow(ss, 0.85)); u = 0.92 + ss * 0.5; a = x * hw + Math.sin(k.ph * 1.1 - ss * 3.4) * 0.035 * s * ss; b = -0.01 * s + x * x * ss * 0.05 * s + Math.sin(k.ph * 1.1 - ss * 3 + x * 1.3) * 0.022 * s * ss; }
      else if (type === 1) { const Hh = 0.21 * s, l = lean * (1 - ss * 0.3); u = 0.3 + ss * 0.42; a = Math.sin(l) * tt * Hh; b = R0 * fprof(u) * 0.72 + Math.cos(l) * tt * Hh; }
      else if (type === 2) { const fold = Math.min(1, Math.max(0, (k.spd - k.base * 0.95) / (k.base * 0.7))), ph = 0.35 + 0.28 * Math.sin(k.ph * 0.55 + side * 0.6) * (1 - 0.6 * fold) + fold * 0.4, ext = ss * 0.36 * s * (1 - 0.28 * fold); u = 0.15 + tt * 0.15 - ss * (0.07 + 0.09 * fold); a = side * (R0 * fprof(u) * 0.78 + ext * Math.cos(ph)); b = -R0 * 0.3 - ext * Math.sin(ph) - ss * ss * 0.02 * s; }
      else { const ext = ss * 0.18 * s; u = 0.47 + tt * 0.09 - ss * 0.05; a = side * (R0 * fprof(u) * 0.72 + ext * 0.84); b = -R0 * 0.62 - ext * 0.54; }
      this.at(k, u, Q); FP[q * 3] = Q.x + Q.nx * a; FP[q * 3 + 1] = k.y + b; FP[q * 3 + 2] = Q.z + Q.nz * a; });
    k.fins.geometry.attributes.position.needsUpdate = true; k.fins.geometry.computeVertexNormals();
    const ue = 0.075, fe = R0 * fprof(ue); this.at(k, ue, Q);
    k.eyes.forEach((e, i) => { const sd = i ? 1 : -1; e.position.set(Q.x + Q.nx * fe * 0.74 * sd, k.y + fe * 0.5, Q.z + Q.nz * fe * 0.74 * sd); k.glints[i].position.set(e.position.x + Q.tx * 0.011 * s, e.position.y + 0.025 * s, e.position.z + Q.tz * 0.011 * s); });
    const ub = 0.022, fb = R0 * fprof(ub); this.at(k, ub, Q); const BP = k.barbs.geometry.attributes.position.array as Float32Array, bp = k.bp, by = k.y - fb * 0.15;
    for (let sd = 0; sd < 2; sd++) { const side = sd ? 1 : -1;
      for (let j = 0; j < BN; j++) { const t = j / (BN - 1), lat = fb * 0.5 + 0.14 * s * t + 0.014 * s * Math.sin(k.ph * 0.8 + t * 4 + sd) * t, fwd = 0.05 * s * t - 0.035 * s * t * t; bp[j * 2] = Q.x + Q.nx * side * lat + Q.tx * fwd; bp[j * 2 + 1] = Q.z + Q.nz * side * lat + Q.tz * fwd; }
      for (let j = 0; j < BN; j++) { const a = Math.max(0, j - 1), b = Math.min(BN - 1, j + 1); const dx = bp[b * 2] - bp[a * 2], dz = bp[b * 2 + 1] - bp[a * 2 + 1]; const l = Math.hypot(dx, dz) || 1;
        const w = 0.0062 * s * (1 - (0.65 * j) / (BN - 1)), px = (-dz / l) * w, pz = (dx / l) * w, o = (sd * BN + j) * 2 * 3;
        BP[o] = bp[j * 2] + px; BP[o + 1] = by; BP[o + 2] = bp[j * 2 + 1] + pz; BP[o + 3] = bp[j * 2] - px; BP[o + 4] = by; BP[o + 5] = bp[j * 2 + 1] - pz; } }
    k.barbs.geometry.attributes.position.needsUpdate = true;
    this.at(k, 0.55, Q); const sd = (k.y + 0.85) * 0.3; k.sh.position.set(Q.x + sd * 0.75, -0.83, Q.z + sd); k.sh.rotation.y = Math.atan2(-Q.tz, Q.tx); k.sh.scale.set(k.L * 1.3, 1, R0 * 3.4); (k.sh.material as THREE.MeshBasicMaterial).opacity = 0.5 - (k.y + 0.55) * 0.25;
  }

  /** Deambulan con giros suaves, se esquivan y acuden a la comida sin dar vueltas. */
  private steer(k: Koi, dt: number, t: number) {
    const TQ = this.TQ, TQ2 = this.TQ2, food = this.food;
    const fx = Math.cos(k.ang), fz = Math.sin(k.ang);
    k.wn = 0.65 * Math.sin(t * 0.42 + k.ph0) + 0.35 * Math.sin(t * 0.97 + k.ph0 * 1.7);
    let dx = Math.cos(k.ang + k.wn * 0.42), dz = Math.sin(k.ang + k.wn * 0.42), des = k.base, yT = k.y0;
    k.beat = 0.5 + 0.5 * Math.sin(t * 0.62 + k.ph0 * 1.3);
    const inside = Math.abs(k.x) < BX && k.z > ZMIN && k.z < ZMAX;
    let chasing = false;
    if (!k.leaving && food && t < food.until && k.ate !== food.id) {
      if (k.chaseId !== food.id) { k.chaseId = food.id; k.chaseT = t; k.chaseRot = 0; }
      if (t - k.chaseT > 3.5 || k.chaseRot > 3.2) k.ate = food.id;
    }
    if (!k.leaving && food && t < food.until && k.ate !== food.id) { chasing = true;
      const tx = Math.max(-BX + 0.45, Math.min(BX - 0.45, food.x + k.fo[0] * 0.5)), tz = Math.max(ZMIN + 0.35, Math.min(ZMAX - 0.35, food.z + k.fo[1] * 0.5)), ex = tx - k.x, ez = tz - k.z, d = Math.hypot(ex, ez);
      const bear = Math.abs(Math.atan2(Math.sin(Math.atan2(ez, ex) - k.ang), Math.cos(Math.atan2(ez, ex) - k.ang)));
      if (d < 0.18 + 0.12 * k.s) { k.ate = food.id; k.nibble = t + 1.2; this.BITES.push(k); }
      else if (d < RMIN * k.L * 1.3 && bear > 1.1) k.ate = food.id;
      else { const wf = inside ? 2 : 0.7; dx = dx * 0.2 + (ex / d) * wf; dz = dz * 0.2 + (ez / d) * wf; des = d > 1 ? k.base * 1.8 : k.base * (1 + d * 0.7); } }
    if (t < k.nibble) { des = Math.min(des, k.base * 0.8); yT = k.y0 + 0.04; }
    const la = 0.55 * k.L, px = k.x + fx * la, pz = k.z + fz * la;
    const eX = k.leaving ? 0 : edge(px, -BX, BX) * 5 + edge(k.x, -BX, BX) * 4, eZ = k.leaving ? 0 : edge(pz, ZMIN, ZMAX) * 5 + edge(k.z, ZMIN, ZMAX) * 4; dx += eX; dz += eZ;
    if (k.leaving) { dx = (Math.sign(k.x) || 1) * 2 + fx * 0.3; dz = fz * 0.3; des = k.base * 1.9; }
    else { dx -= k.x * 0.15; dz -= (k.z - (ZMIN + ZMAX) / 2) * 0.22; }
    let sx = 0, sz = 0, yieldF = 1;
    for (const uk of [0, 0.3, 0.6]) { this.at(k, uk, TQ); const px0 = TQ.x, pz0 = TQ.z, rk = RB * k.s * Math.max(0.55, fprof(uk)), wk = uk === 0 ? 1 : uk === 0.3 ? 0.7 : 0.45;
      this.KOI.forEach((o) => { if (o === k || o.layer !== k.layer) return; for (const uo of [0, 0.25, 0.5, 0.75, 1]) { this.at(o, uo, TQ2); const ro = RB * o.s * Math.max(0.3, fprof(uo)), lim = rk + ro + 0.3, ex = px0 - TQ2.x, ez = pz0 - TQ2.z, d = Math.hypot(ex, ez);
        if (d < lim && d > 1e-4) { const w = (1 - d / lim) * 2.6 * wk; sx += (ex / d) * w; sz += (ez / d) * w; if (uk === 0 && -ex * fx - ez * fz > 0.35 * d) yieldF = Math.min(yieldF, 0.55 + (0.45 * d) / lim); } } }); }
    des *= yieldF;
    dx += sx * (inside ? 1 : 0.35); dz += sz * (inside ? 1 : 0.35);
    if (Math.hypot(dx, dz) < 0.3) { dx = fx; dz = fz; }
    let diff = Math.atan2(dz, dx) - k.ang; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) > 2.4 && t >= k.calm) { if (!k.tdir) { const cx = -k.x, cz = (ZMIN + ZMAX) / 2 - k.z, cr = fx * cz - fz * cx; k.tdir = Math.abs(cr) > 0.05 ? Math.sign(cr) : Math.sign(k.av) || 1; k.tRot = 0; } diff = k.tdir * Math.abs(diff); }
    else if (Math.abs(diff) < 1.2) k.tdir = 0;
    if (k.tdir && k.tRot > PI) { k.tdir = 0; k.calm = t + 2.5; }
    const wMax = Math.min(WCAP, Math.max(0.05, k.spd) / (RMIN * k.L)); let wDes = Math.max(-wMax, Math.min(wMax, diff * 1.6));
    if (t < k.calm && Math.abs(eX) + Math.abs(eZ) < 0.6 && Math.sign(wDes) === Math.sign(k.rot)) wDes *= 0.2;
    des *= 1 - 0.25 * Math.min(1, Math.abs(diff) / 2); des *= 0.84 + 0.32 * k.beat;
    k.spd += (des - k.spd) * Math.min(1, dt * 0.9);
    const wLim = Math.min(WCAP, Math.max(0.05, k.spd) / (RMIN * k.L)); k.av += (wDes - k.av) * Math.min(1, dt * 2.2); k.av = Math.max(-wLim, Math.min(wLim, k.av)); k.ang += k.av * dt; if (chasing) k.chaseRot += Math.abs(k.av * dt); if (k.tdir) k.tRot += Math.abs(k.av * dt);
    k.rot = k.rot * (1 - Math.min(1, dt / 6)) + k.av * dt; if (Math.abs(k.rot) > 4.2 && t >= k.calm) k.calm = t + 3;
    k.x += Math.cos(k.ang) * k.spd * dt; k.z += Math.sin(k.ang) * k.spd * dt; k.ph += dt * (2.8 + k.spd * 8.5) * (0.72 + 0.5 * k.beat);
    k.y += (yT - k.y) * Math.min(1, dt * 1.5);
    const H = k.hist; H[0][0] = k.x; H[0][1] = k.z; if (Math.hypot(H[0][0] - H[1][0], H[0][1] - H[1][1]) > 0.012) H.unshift([k.x, k.z]);
    let acc = 0; for (let i = 1; i < H.length; i++) { acc += Math.hypot(H[i][0] - H[i - 1][0], H[i][1] - H[i - 1][1]); if (acc > UMAX * k.L + 0.4) { H.length = i + 1; break; } }
  }

  private spawnPellets(x: number, z: number) { for (let i = 0; i < 6; i++) { const a = Math.random() * PI * 2, r = Math.random() * 0.28, m = new THREE.Mesh(this.pelletGeo, this.pelletMat); const p: Pellet = { m, x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, t0: this.uT.value + i * 0.05, ph: Math.random() * 6, state: 0, ts: 0 }; m.position.set(p.x, 0.31, p.z); m.scale.setScalar(0.001); this.top.add(m); this.PEL.push(p); } }
  private eatPellet(x: number, z: number) { let best: Pellet | null = null, bd = 0.8; this.PEL.forEach((p) => { if (p.state) return; const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } }); if (best) { (best as Pellet).state = 1; (best as Pellet).ts = this.uT.value; } }
  private bubbles(x: number, z: number, y: number) { for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bubTex, transparent: true, depthWrite: false })); sp.scale.setScalar(0.001); this.top.add(sp); this.BUBS.push({ sp, x: x + (Math.random() - 0.5) * 0.08, z: z + (Math.random() - 0.5) * 0.08, y0: y, t0: this.uT.value + i * 0.18, dur: 0.9 + Math.random() * 0.3 }); } }
  private updateFX(t: number) {
    for (let i = this.PEL.length - 1; i >= 0; i--) { const p = this.PEL[i], age = t - p.t0;
      if (p.state === 0) { p.m.scale.setScalar(Math.max(0.001, Math.min(1, age / 0.25))); p.m.position.set(p.x + Math.sin(t * 0.7 + p.ph) * 0.02, 0.31 + Math.sin(t * 2.2 + p.ph) * 0.008, p.z + Math.cos(t * 0.6 + p.ph) * 0.02); if (!this.food || t > this.food.until) { p.state = 2; p.ts = t; } }
      else if (p.state === 1) { const k = Math.min(1, (t - p.ts) / 0.2); p.m.scale.setScalar(Math.max(0.001, (1 + 0.6 * Math.sin(k * PI)) * (1 - k))); if (k >= 1) { this.top.remove(p.m); this.PEL.splice(i, 1); } }
      else { const k = Math.min(1, (t - p.ts) / 0.8); p.m.position.y = 0.31 - k * 0.5; p.m.scale.setScalar(Math.max(0.001, 1 - k)); if (k >= 1) { this.top.remove(p.m); this.PEL.splice(i, 1); } } }
    for (let i = this.BUBS.length - 1; i >= 0; i--) { const b = this.BUBS[i], k = (t - b.t0) / b.dur; if (k < 0) continue;
      if (k >= 1) { this.ripple(b.x, b.z); this.top.remove(b.sp); b.sp.material.dispose(); this.BUBS.splice(i, 1); continue; }
      b.sp.position.set(b.x + Math.sin(k * 9 + i) * 0.02, b.y0 + (0.3 - b.y0) * k, b.z); b.sp.scale.setScalar(0.05 + 0.05 * k); b.sp.material.opacity = k > 0.85 ? (1 - k) / 0.15 : 1; }
  }
  /* Alimentar solo con un toque: si el dedo se desliza (scroll) o el navegador cancela el gesto, no pasa nada. */
  private press: { id: number; x: number; y: number; t: number } | null = null;
  private onDown = (e: PointerEvent) => { this.press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; };
  private onCancel = () => { this.press = null; };
  private onUp = (e: PointerEvent) => {
    const p = this.press; this.press = null;
    if (!p || p.id !== e.pointerId || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10 || performance.now() - p.t > 700) return;
    this.onPointer(e);
  };
  private onPointer = (e: PointerEvent) => {
    const r = this.cv.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.cam);
    if (this.ray.ray.intersectPlane(this.plane, this.hit)) { this.ripple(this.hit.x, this.hit.z); this.food = { x: Math.max(-BX, Math.min(BX, this.hit.x)), z: Math.max(ZMIN, Math.min(ZMAX, this.hit.z)), until: this.uT.value + 6, id: ++this.foodId }; this.spawnPellets(this.hit.x, this.hit.z); this.onFeed?.(); }
  };
  private size() { const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return; this.R.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = this.cam.aspect < 0.95 ? 44 : 36; this.cam.position.set(0, 6.1, 3.1); this.cam.lookAt(0, -0.35, 0.18); this.cam.updateProjectionMatrix(); if (!this.on) this.draw(); }
  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.t0) / 1000); this.t0 = now; this.uT.value += dt; const t = this.uT.value;
    if (t > this.nextDrip) { this.ripple((Math.random() * 2 - 1) * BX, (Math.random() * 2 - 1) * BZ); this.nextDrip = t + 3 + Math.random() * 4; }
    const rm = RM();
    this.KOI.forEach((k) => { this.steer(k, rm ? 0 : dt, t); this.pose(k); });
    while (this.BITES.length) { const k = this.BITES.pop()!; this.at(k, 0, this.TQ); const mx = this.TQ.x + this.TQ.tx * 0.06 * k.s, mz = this.TQ.z + this.TQ.tz * 0.06 * k.s; this.eatPellet(mx, mz); this.ripple(mx, mz); this.bubbles(mx, mz, k.y + 0.1); }
    const gone = this.KOI.filter((k) => k.leaving && Math.abs(k.x) > BX + 3);
    if (gone.length) { gone.forEach((k) => { k.leaving = false; this.showKoi(k, false); }); this.KOI = this.KOI.filter((k) => !gone.includes(k)); this.ORDER = this.ORDER.filter((k) => !gone.includes(k)); }
    this.updateFX(t);
    this.pads.forEach((p) => { p.m.position.y = 0.32 + Math.sin(t * 0.8 + p.ph) * 0.006; p.m.rotation.y = p.rot + Math.sin(t * 0.2 + p.ph) * 0.05; });
    this.flower.rotation.y = Math.sin(t * 0.3) * 0.15;
    this.draw();
    if (this.on && this.vis && !rm) this.raf = requestAnimationFrame(this.frame);
  };
  start() { if (this.on || this.disposed) return; this.on = true; this.size(); this.t0 = performance.now(); this.raf = requestAnimationFrame(this.frame); }
  stop() { this.on = false; cancelAnimationFrame(this.raf); }
  dispose() { this.stop(); this.disposed = true; this.io.disconnect(); this.ro.disconnect(); this.cv.removeEventListener("pointerdown", this.onDown); this.cv.removeEventListener("pointerup", this.onUp); this.cv.removeEventListener("pointercancel", this.onCancel); this.R.dispose(); }
}
