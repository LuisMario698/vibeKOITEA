import * as THREE from "three";
import { PI, RM, canvasFilter, cl, ctex, easeBack, easeInOut, easeOut, fontFamily, makeRenderer, mk, studioEnv } from "./common";
import type { Drink, ToppingType } from "../menu/types";

export interface CupTopping { type: ToppingType; color: string }
export interface CupOpts { top: CupTopping; ice: number; sweet: number }
type DrinkLook = Pick<Drink, "id" | "kind" | "c1" | "c2">;

const SEG = 72, TOP = 3.0;
const wallR = (y: number) => 0.78 + 0.24 * (y / TOP);
const CAP = [0.88, 0.74, 0.6, 0.46, 0.32, 0.18, 0.07];
const PROF_N = 5 + CAP.length + 1;
const V2 = (x: number, y: number) => new THREE.Vector2(x, y);

/** Líquido con tapa de varios anillos: se mece, ondula y cambia de nivel sin crear geometría nueva. */
class Liquid {
  geo = new THREE.BufferGeometry();
  private pos: Float32Array;
  private uv: Float32Array;
  constructor() {
    const n = (SEG + 1) * PROF_N;
    this.pos = new Float32Array(n * 3);
    this.uv = new Float32Array(n * 2);
    const idx: number[] = [];
    for (let i = 0; i < SEG; i++) for (let j = 0; j < PROF_N - 1; j++) {
      const base = j + i * PROF_N, a = base, b = base + PROF_N, c = base + PROF_N + 1, d = base + 1;
      idx.push(a, b, d, c, d, b);
    }
    this.geo.setIndex(idx);
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2));
    this.update(0.2, 0, 0, 0, 0);
  }
  update(level: number, tx: number, tz: number, rip: number, rt: number) {
    level = Math.max(0.14, level);
    const rw = wallR(level) - 0.05;
    const prof: Array<[number, number]> = [[0, 0.05], [0.68, 0.05], [0.73, 0.08], [wallR(0.14) - 0.05, 0.14], [rw, level]];
    for (const f of CAP) prof.push([rw * f, level + 0.004]);
    prof.push([0, level + 0.006]);
    const P = this.pos, U = this.uv;
    let k = 0;
    for (let i = 0; i <= SEG; i++) {
      const phi = (i / SEG) * PI * 2, s = Math.sin(phi), c = Math.cos(phi);
      for (let j = 0; j < PROF_N; j++, k++) {
        const [r, y] = prof[j];
        const x = r * s, z = r * c;
        let yy = y;
        if (y >= level - 1e-4) {
          const rr = Math.hypot(x, z);
          let dy = tx * x + tz * z;
          if (rip > 1e-4) dy += rip * Math.sin(rr * 13 - rt * 10) * Math.exp(-rr * 0.9);
          yy = y + dy;
        }
        P[k * 3] = x; P[k * 3 + 1] = yy; P[k * 3 + 2] = z;
        U[k * 2] = i / SEG; U[k * 2 + 1] = cl((y - 0.05) / (level - 0.05), 0, 1);
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.uv.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
}

interface Build { start: number; top: CupTopping; iceK: number; pearls?: boolean; ice?: boolean; stab?: boolean }
interface Spin { from: number; to: number; start: number; dur: number; d: DrinkLook; top: CupTopping; done: boolean }
interface IceCube { m: THREE.Mesh; p: [number, number, number]; on: boolean; t0: number; from: number; landed?: boolean }

/** El vaso de boba en 3D: se arma (perlas → té → hielo → sellado → popote), gira con el dedo y el líquido se mece. */
export class CupEngine {
  readonly canvas: HTMLCanvasElement;
  readonly ready: Promise<void>;
  private R: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
  private target = new THREE.Vector3(0, 2.15, 0);
  private cup = new THREE.Group();
  private liquid: Liquid;
  private liqMesh: THREE.Mesh;
  private liqMat: THREE.MeshStandardMaterial;
  private texCache = new Map<string, THREE.Texture>();
  private film: THREE.Mesh; private filmMat: THREE.MeshStandardMaterial;
  private strawG = new THREE.Group(); private sDir: THREE.Vector3;
  private bub: THREE.Mesh; private bTex: THREE.Texture;
  private stream: THREE.Mesh; private streamMat: THREE.MeshStandardMaterial;
  private SPOTS: THREE.Vector3[] = [];
  private pearls: THREE.InstancedMesh; private jelly: THREE.InstancedMesh;
  private pearlMat: THREE.MeshPhysicalMaterial; private popMat: THREE.MeshPhysicalMaterial; private jellyMat: THREE.MeshPhysicalMaterial;
  private dummy = new THREE.Object3D();
  private drop: { start: number; dur: number } | null = null;
  private curTop: CupTopping | null = null;
  private dropFrom = TOP + 1;
  private swapOut: { start: number; dur: number; next: CupTopping } | null = null;
  private landed = false;
  private ice = new THREE.Group(); private ICE: IceCube[] = []; private iceK = 2;
  private label: THREE.Mesh;
  private shadow: THREE.Mesh;
  private cond: THREE.Mesh; private condMat: THREE.MeshStandardMaterial;
  private glint: THREE.Mesh; private gTex: THREE.Texture;
  private level = 0; private levelTo = 2.55; private levelBase = 2.55;
  private sweep = 0; private condT = 0; private camD = 13.4;
  private host: HTMLElement | null = null; private ro: ResizeObserver | null = null;
  private raf = 0; private rot = -0.4; private vel = 0; private drag = false; private lastX = 0;
  private spin: Spin | null = null; private build: Build | null = null;
  private t0 = 0; private cur: DrinkLook | null = null;
  private slosh = { x: 0, v: 0 }; private swirl = { x: 0, v: 0 };
  private rip = 0; private rt = 0; private prevRot = 0; private prevAV = 0;
  private disposed = false;

  constructor(R: THREE.WebGLRenderer, canvas: HTMLCanvasElement) {
    this.R = R; this.canvas = canvas;
    canvas.className = "c3d"; canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "Vaso de boba en 3D. Arrastra para girarlo.");
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;
    const { scene, cup } = this;
    scene.environment = studioEnv(R, 0.42, [[5, 9, [-8, 4, 6], 3.2, 0xffffff], [4, 10, [8, 3, 3], 2.4, 0xfff0dc], [12, 3, [0, 12, 0], 2.2, 0xffffff], [3, 8, [0, 3, -10], 1.6, 0xffe6c9]], 1.5);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a6a50, 0.6 * PI));
    const key = new THREE.DirectionalLight(0xfff2e0, 1.1 * PI); key.position.set(-4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2c4, 0.7 * PI); rim.position.set(5, 4, -5); scene.add(rim);
    scene.add(cup);
    // vaso transparente
    const clear = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.06, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false });
    const body = new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.7, 0), V2(0.76, 0.03), V2(0.78, 0.1), V2(1.02, TOP), V2(1.05, TOP + 0.03), V2(1.06, TOP + 0.07)], SEG), clear);
    body.renderOrder = 5; cup.add(body);
    const edge = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.1, clearcoat: 1, envMapIntensity: 2 });
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.02, 10, SEG), edge); r1.rotation.x = PI / 2; r1.position.y = 0.07; r1.renderOrder = 6; cup.add(r1);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.028, 10, SEG), edge); r2.rotation.x = PI / 2; r2.position.y = TOP + 0.06; r2.renderOrder = 7; cup.add(r2);
    // película sellada
    const fc = mk(512, 512, (g) => {
      g.fillStyle = "#FBF6EF"; g.beginPath(); g.arc(256, 256, 256, 0, 7); g.fill();
      g.strokeStyle = "rgba(39,33,30,.75)"; g.lineCap = "round";
      for (let i = 0; i < 5; i++) { g.lineWidth = 6 - i; g.beginPath(); const y = 300 + i * 26; g.moveTo(70 + i * 10, y); g.bezierCurveTo(170, y - 40, 300, y + 40, 440 - i * 10, y - 10); g.stroke(); }
      g.fillStyle = "#E2482B"; g.beginPath(); g.arc(330, 170, 26, 0, 7); g.fill();
      g.fillStyle = "#27211E"; g.font = `800 64px ${fontFamily("--font-display", "Georgia, serif")}`; g.textAlign = "center"; g.fillText("KOI TEA", 256, 200);
      g.font = `500 22px ${fontFamily("--font-mono", "monospace")}`; const s = " BOBA SHOP · PUERTO PEÑASCO · ROCKY POINT ·"; g.save(); g.translate(256, 256);
      for (let i = 0; i < s.length; i++) { g.save(); g.rotate((i / s.length) * PI * 2); g.fillText(s[i], 0, -222); g.restore(); } g.restore();
    });
    const filmTex = ctex(fc);
    this.filmMat = new THREE.MeshStandardMaterial({ map: filmTex, roughness: 0.5, transparent: true, opacity: 0.96 });
    this.film = new THREE.Mesh(new THREE.CircleGeometry(1.055, SEG), this.filmMat); this.film.rotation.x = -PI / 2; this.film.position.y = TOP + 0.07; this.film.renderOrder = 8; cup.add(this.film);
    // popote
    const sA = new THREE.Vector3(0.2, 0.35, 0.05), sB = new THREE.Vector3(0.52, 4.5, -0.1);
    this.sDir = sB.clone().sub(sA).normalize();
    cup.add(this.strawG);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, sA.distanceTo(sB), 28, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xc8331a, roughness: 0.35, clearcoat: 0.5, envMapIntensity: 0.45, side: THREE.DoubleSide }));
    straw.position.copy(sA).add(sB).multiplyScalar(0.5); straw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.sDir); this.strawG.add(straw);
    // líquido
    this.liqMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, envMapIntensity: 0.5 });
    this.liquid = new Liquid();
    this.liqMesh = new THREE.Mesh(this.liquid.geo, this.liqMat); cup.add(this.liqMesh);
    // burbujas de los fruit teas
    const bcv = mk(256, 512, (g) => { for (let i = 0; i < 80; i++) { const x = Math.random() * 256, y = Math.random() * 512, r = 1.5 + Math.random() * 4.5; g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = "rgba(255,255,255,.28)"; g.fill(); g.lineWidth = 1.3; g.strokeStyle = "rgba(255,255,255,.8)"; g.stroke(); } });
    this.bTex = ctex(bcv, false); this.bTex.wrapS = this.bTex.wrapT = THREE.RepeatWrapping; this.bTex.repeat.set(3, 1.3);
    this.bub = new THREE.Mesh(new THREE.CylinderGeometry(wallR(2.6) - 0.035, wallR(0.12) - 0.035, 1, 48, 1, true), new THREE.MeshBasicMaterial({ map: this.bTex, transparent: true, depthWrite: false }));
    this.bub.renderOrder = 4; this.bub.visible = false; cup.add(this.bub);
    // chorro al servir
    this.streamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, envMapIntensity: 0.6 });
    this.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 1, 16, 1, true), this.streamMat); this.stream.visible = false; cup.add(this.stream);
    // perlas y jellys
    const lay: Array<[number, number, number]> = [[0.22, 13, 0], [0.22, 5, 0.3], [0.46, 13, 0.24], [0.46, 5, 0.55], [0.7, 10, 0.1], [0.7, 4, 0.4]];
    lay.forEach(([y, n, off], li) => { const rr = li % 2 ? 0.32 : wallR(y) - 0.18; for (let i = 0; i < n; i++) { const a = ((i + off) / n) * PI * 2; this.SPOTS.push(new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr)); } });
    this.SPOTS.push(new THREE.Vector3(0, 0.22, 0));
    const N = this.SPOTS.length;
    this.pearlMat = new THREE.MeshPhysicalMaterial({ color: 0x120804, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.35 });
    this.popMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, clearcoat: 1, transparent: true, opacity: 0.88, envMapIntensity: 1.3 });
    this.jellyMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 1, transparent: true, opacity: 0.78, envMapIntensity: 1.2 });
    this.pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 20, 14), this.pearlMat, N);
    this.jelly = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), this.jellyMat, N);
    this.pearls.frustumCulled = this.jelly.frustumCulled = false;
    this.pearls.renderOrder = 1; this.jelly.renderOrder = 1; cup.add(this.pearls); cup.add(this.jelly);
    this.pearls.visible = this.jelly.visible = false;
    // hielo
    const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xfdfaf6, transparent: true, opacity: 0.5, roughness: 0.1, clearcoat: 1, envMapIntensity: 1.6 });
    cup.add(this.ice); const ig = new THREE.BoxGeometry(0.34, 0.3, 0.34);
    const icePos: Array<[number, number, number]> = [[0.28, 0, 0.22], [-0.32, 0.06, 0.12], [0.05, 0.1, -0.34], [-0.15, -0.05, 0.4], [0.4, 0.1, -0.12], [-0.4, 0.02, -0.25], [0.1, 0.2, 0.05]];
    this.ICE = icePos.map((p, i) => { const m = new THREE.Mesh(ig, iceMat); m.rotation.set(i * 0.7, i * 1.3, i * 0.4); m.renderOrder = 2; m.visible = false; this.ice.add(m); return { m, p, on: false, t0: -9, from: TOP + 1 }; });
    // calcomanía con el logo
    const LS = 512, yB = 1.05, yT = 2.15, lh = yT - yB, midR = wallR((yB + yT) / 2) + 0.014, tl = lh / midR;
    const lcv = document.createElement("canvas"); lcv.width = lcv.height = LS; const lg = lcv.getContext("2d")!;
    const labTex = ctex(lcv);
    this.label = new THREE.Mesh(new THREE.CylinderGeometry(wallR(yT) + 0.014, wallR(yB) + 0.014, lh, 40, 1, true, -tl / 2, tl), new THREE.MeshStandardMaterial({ map: labTex, transparent: true, alphaTest: 0.5, roughness: 0.5 }));
    this.label.position.y = (yB + yT) / 2; this.label.renderOrder = 3; cup.add(this.label);
    this.ready = new Promise<void>((res) => {
      const im = new Image();
      im.onload = () => { lg.save(); lg.beginPath(); lg.arc(LS / 2, LS / 2, LS / 2 - 6, 0, 7); lg.clip(); lg.drawImage(im, 0, 0, LS, LS); lg.restore(); lg.lineWidth = 10; lg.strokeStyle = "#FBF6EF"; lg.beginPath(); lg.arc(LS / 2, LS / 2, LS / 2 - 8, 0, 7); lg.stroke(); labTex.needsUpdate = true; res(); };
      im.onerror = () => res();
      im.src = "/img/logo_big.jpg";
    });
    // sombra
    const sc = mk(256, 256, (g) => { const rg = g.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, "rgba(30,18,10,.45)"); rg.addColorStop(0.55, "rgba(30,18,10,.14)"); rg.addColorStop(1, "rgba(30,18,10,0)"); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: ctex(sc, false), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -PI / 2; this.shadow.position.y = 0.002; scene.add(this.shadow);
    // condensación
    const dcv = mk(1024, 512, (g) => {
      for (let i = 0; i < 1100; i++) { const x = Math.random() * 1024, y = Math.random() * 512, r = 1.2 + Math.pow(Math.random(), 2.5) * 8; const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.3, "rgba(255,255,255,.45)"); rg.addColorStop(0.72, "rgba(110,92,80,.2)"); rg.addColorStop(1, "rgba(110,92,80,0)"); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, r, r * 1.15, 0, 0, 7); g.fill(); }
      for (let i = 0; i < 9; i++) { let x = Math.random() * 1024, y = Math.random() * 200; g.strokeStyle = "rgba(255,255,255,.32)"; g.lineWidth = 2 + Math.random() * 2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { y += 30 + Math.random() * 30; x += Math.random() * 6 - 3; g.lineTo(x, y); } g.stroke(); g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(x, y + 3, 3.5, 0, 7); g.fill(); }
    });
    const dTex = ctex(dcv); dTex.wrapS = THREE.RepeatWrapping; dTex.repeat.set(2, 1);
    this.condMat = new THREE.MeshStandardMaterial({ map: dTex, transparent: true, opacity: 0, roughness: 0.08, metalness: 0, envMapIntensity: 1.6, depthWrite: false });
    this.cond = new THREE.Mesh(new THREE.CylinderGeometry(wallR(2.85) + 0.022, wallR(0.25) + 0.022, 2.6, 64, 1, true), this.condMat); this.cond.position.y = 1.55; this.cond.renderOrder = 9; cup.add(this.cond);
    // brillo que recorre el vidrio
    const gcv = mk(512, 8, (g) => { const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.44, "rgba(255,255,255,0)"); gr.addColorStop(0.49, "rgba(255,255,255,.85)"); gr.addColorStop(0.51, "rgba(255,255,255,.85)"); gr.addColorStop(0.56, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 8); });
    this.gTex = ctex(gcv, false); this.gTex.wrapS = THREE.RepeatWrapping;
    this.glint = new THREE.Mesh(new THREE.CylinderGeometry(wallR(3) + 0.03, wallR(0.15) + 0.03, 2.85, 64, 1, true), new THREE.MeshBasicMaterial({ map: this.gTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glint.position.y = 1.575; this.glint.renderOrder = 10; this.glint.visible = false; cup.add(this.glint);
    // arrastre
    canvas.addEventListener("pointerdown", (e) => { this.drag = true; this.lastX = e.clientX; this.vel = 0; try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ } });
    canvas.addEventListener("pointermove", (e) => { if (!this.drag) return; const dx = e.clientX - this.lastX; this.lastX = e.clientX; this.vel = dx * 0.012; this.rot += this.vel; this.spin = null; });
    const up = () => { this.drag = false; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  }

  static create(): CupEngine | null {
    const canvas = document.createElement("canvas");
    const R = makeRenderer(canvas);
    if (!R) return null;
    return new CupEngine(R, canvas);
  }

  private liqTex(d: DrinkLook): THREE.Texture {
    const hit = this.texCache.get(d.id); if (hit) return hit;
    const c2 = d.c2 ?? d.c1;
    const c = mk(512, 512, (g) => {
      if (d.kind === "fruit") {
        const gr = g.createLinearGradient(0, 512, 0, 0); gr.addColorStop(0, d.c1); gr.addColorStop(0.38, d.c1); gr.addColorStop(0.62, c2); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 70; i++) { g.fillStyle = "rgba(255,255,255," + (0.15 + Math.random() * 0.25) + ")"; g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 0, 7); g.fill(); }
      } else {
        g.fillStyle = d.c1; g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 34; i++) { const x = Math.random() * 512, y = Math.random() * 512, r = 30 + Math.random() * 70, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, d.kind === "smooth" ? "rgba(255,255,255,.22)" : "rgba(255,248,236,.25)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
        if (d.kind === "smooth") for (let i = 0; i < 500; i++) { g.fillStyle = "rgba(255,255,255," + Math.random() * 0.35 + ")"; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
        if (d.kind === "brown") {
          const pool = g.createLinearGradient(0, 512, 0, 330); pool.addColorStop(0, c2); pool.addColorStop(1, "rgba(90,46,20,0)"); g.fillStyle = pool; g.fillRect(0, 330, 512, 182);
          for (let i = 0; i < 16; i++) { let x = Math.random() * 512, y = 0; g.fillStyle = "rgba(90,46,20," + (0.55 + Math.random() * 0.35) + ")"; g.beginPath(); const w = 6 + Math.random() * 14; g.moveTo(x - w, 0); const pts: number[][] = []; const end = 170 + Math.random() * 300; while (y < end) { y += 20 + Math.random() * 30; x += Math.random() * 24 - 12; pts.push([x, y, w * (1 - (y / end) * 0.6)]); } pts.forEach((q) => g.lineTo(q[0] - q[2], q[1])); pts.slice().reverse().forEach((q) => g.lineTo(q[0] + q[2], q[1])); g.lineTo(x + w, 0); g.closePath(); g.fill(); }
          if (canvasFilter()) { g.filter = "blur(4px)"; g.drawImage(g.canvas, 0, 0); g.filter = "none"; }
        }
      }
    });
    const t = ctex(c); this.texCache.set(d.id, t); return t;
  }

  private placeTop(t: number | null, sc?: number) {
    if (!this.curTop) return;
    const mesh = this.curTop.type === "jelly" ? this.jelly : this.pearls, s = sc == null ? 1 : sc;
    const N = this.SPOTS.length;
    for (let i = 0; i < N; i++) {
      const p = this.SPOTS[i]; let y = p.y;
      if (t !== null) { const local = cl((t * 1.9 - i * 0.022) / 0.75, 0, 1); const e = local < 1 ? 1 - Math.pow(1 - local, 3) * Math.cos(local * 9) : 1; y = p.y + (this.dropFrom - p.y) * (1 - Math.min(1, e)); }
      this.dummy.position.set(p.x, y, p.z); this.dummy.rotation.set(i * 0.7, i * 1.1, i * 0.3); this.dummy.scale.setScalar(s); this.dummy.updateMatrix(); mesh.setMatrixAt(i, this.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  private applyTop(top: CupTopping, animate: boolean) {
    this.curTop = top; const isJ = top.type === "jelly";
    this.pearls.visible = !isJ; this.jelly.visible = isJ;
    const mat = top.type === "tapioca" ? this.pearlMat : top.type === "pop" ? this.popMat : this.jellyMat;
    this.pearls.material = top.type === "tapioca" ? this.pearlMat : this.popMat;
    if (top.type !== "tapioca") mat.color.set(top.color);
    if (animate && !RM()) { this.drop = { start: performance.now(), dur: 1300 }; this.landed = false; this.placeTop(0); }
    else { this.drop = null; this.placeTop(null); }
  }
  private setTop(top: CupTopping, animate: boolean) {
    if (animate && !RM() && this.curTop && (this.curTop.type !== top.type || this.curTop.color !== top.color) && !this.drop) { this.swapOut = { start: performance.now(), dur: 200, next: top }; return; }
    this.applyTop(top, animate);
  }
  private setIce(k: number, animate: boolean) {
    this.iceK = k; const n = [0, 4, 7][k] ?? 7, now = performance.now() / 1000;
    this.ICE.forEach((c, i) => {
      const want = i < n;
      if (want && !c.on) { c.on = true; c.m.visible = true; c.t0 = animate && !RM() ? now + i * 0.06 : -9; c.from = this.film.visible ? TOP - 0.2 : TOP + 1; }
      else if (!want && c.on) { c.on = false; c.t0 = animate && !RM() ? now : -9; if (!animate || RM()) c.m.visible = false; }
    });
    this.levelTo = Math.min(TOP - 0.15, this.levelBase + [0.12, 0.06, 0][k]);
  }
  splash(a: number) { this.rip = Math.min(0.07, this.rip + a); }
  private applyDrink(d: DrinkLook) {
    this.cur = d; this.liqMat.map = this.liqTex(d); this.liqMat.roughness = d.kind === "fruit" ? 0.18 : d.kind === "smooth" ? 0.6 : 0.42; this.liqMat.needsUpdate = true;
    this.levelBase = d.kind === "smooth" ? 2.72 : 2.55; this.levelTo = Math.min(TOP - 0.15, this.levelBase + [0.12, 0.06, 0][this.iceK]); this.bub.visible = d.kind === "fruit";
    this.streamMat.color.set(d.kind === "fruit" ? (d.c2 ?? d.c1) : d.c1);
  }
  private size = () => {
    if (!this.host) return; const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.R.setSize(w, h, false); this.cam.aspect = w / h; const dist = 13.4 * Math.max(1, 0.62 / this.cam.aspect); this.camD = dist; this.cam.position.set(0, 3.1, dist); this.cam.lookAt(this.target); this.cam.updateProjectionMatrix();
  };

  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.t0) / 1000); this.t0 = now; const ts = now / 1000; let lift = 0, squash = 0;
    const { cup, build, film, filmMat, strawG, stream, sDir } = this;
    const rm = RM();
    if (build) {
      const e = (now - build.start) / 1000;
      const kr = easeOut(cl(e / 0.6, 0, 1)); lift = (1 - kr) * -1.6; cup.rotation.y = this.rot + (1 - kr) * -2.4;
      if (!build.pearls && e > 0.1) { build.pearls = true; this.dropFrom = TOP + 1; this.applyTop(build.top, true); }
      stream.visible = e > 0.45 && e < 1.5;
      this.level = 0.14 + (this.levelTo - 0.14) * easeInOut(cl((e - 0.55) / 0.9, 0, 1));
      if (stream.visible) { const topY = TOP + 3, thin = e > 1.32 ? Math.max(0, 1 - (e - 1.32) / 0.18) : Math.min(1, (e - 0.45) / 0.08); stream.scale.set(thin, topY - this.level, thin); stream.position.set(0.16 + Math.sin(ts * 9) * 0.015, (topY + this.level) / 2, 0.08); this.rip = Math.max(this.rip, 0.022 * thin); }
      if (!build.ice && e > 1.12) { build.ice = true; this.setIce(build.iceK, true); }
      const se = cl((e - 1.5) / 0.35, 0, 1); film.visible = e > 1.5;
      if (film.visible) { film.position.y = TOP + 0.07 + (1 - easeBack(se)) * 0.7; filmMat.opacity = 0.96 * Math.min(1, se * 2.5); squash = Math.sin(PI * cl((e - 1.72) / 0.22, 0, 1)) * 0.035; }
      const st = cl((e - 1.88) / 0.42, 0, 1); strawG.visible = e > 1.88; strawG.position.copy(sDir).multiplyScalar((1 - easeBack(st)) * 3.2);
      if (!build.stab && st >= 1) { build.stab = true; this.splash(0.035); this.sweep = now; }
      if (e > 2.4) { this.build = null; stream.visible = false; film.position.y = TOP + 0.07; filmMat.opacity = 0.96; strawG.position.set(0, 0, 0); }
    } else if (this.spin) {
      const sp = this.spin; const t = Math.min(1, (now - sp.start) / sp.dur), e = easeInOut(t); this.rot = sp.from + (sp.to - sp.from) * e; lift = Math.sin(PI * t) * 0.4; cup.rotation.z = Math.sin(PI * t) * 0.06;
      if (!sp.done && t > 0.45) { this.applyDrink(sp.d); this.dropFrom = TOP - 0.2; this.applyTop(sp.top, true); this.level = 0.2; sp.done = true; this.splash(0.03); }
      if (sp.done) this.level += (this.levelTo - this.level) * 0.12;
      if (t >= 1) { this.spin = null; this.sweep = now; }
      cup.rotation.y = this.rot;
    } else {
      if (!this.drag) { this.vel *= 0.94; this.rot += this.vel + (rm ? 0 : 0.35 * dt * (Math.abs(this.vel) < 0.002 ? 1 : 0)); cup.rotation.z *= 0.9; }
      cup.rotation.y = this.rot; this.level += (this.levelTo - this.level) * 0.1;
    }
    // el líquido se mece con la aceleración del giro
    const av = dt > 0 ? (cup.rotation.y - this.prevRot) / dt : 0, aa = dt > 0 ? (av - this.prevAV) / dt : 0; this.prevRot = cup.rotation.y; this.prevAV = av;
    if (!rm) {
      this.slosh.v += (-42 * this.slosh.x - 3.2 * this.slosh.v - cl(aa, -60, 60) * 0.0045) * dt; this.slosh.x = cl(this.slosh.x + this.slosh.v * dt, -0.13, 0.13);
      this.swirl.v += ((-cl(av, -8, 8) * 0.32 - this.swirl.x) * 14 - this.swirl.v * 4) * dt; this.swirl.x += this.swirl.v * dt; this.rip *= Math.exp(-dt * 2.4); this.rt += dt;
    }
    const th = cup.rotation.y;
    this.liquid.update(this.level, this.slosh.x * Math.cos(th), this.slosh.x * Math.sin(th), this.rip, this.rt);
    if (this.bub.visible) { this.bub.scale.y = Math.max(0.01, this.level - 0.12); this.bub.position.y = 0.12 + (this.level - 0.12) / 2; this.bTex.offset.y -= dt * 0.16; }
    this.pearls.rotation.y = this.jelly.rotation.y = this.swirl.x; this.ice.rotation.y = this.swirl.x * 0.5;
    // toppings
    if (this.swapOut) { const so = this.swapOut; const t = Math.min(1, (now - so.start) / so.dur); this.placeTop(null, 1 - t); if (t >= 1) { this.swapOut = null; this.dropFrom = film.visible ? TOP - 0.2 : TOP + 1; this.applyTop(so.next, true); } }
    else if (this.drop) { const t = Math.min(1, (now - this.drop.start) / this.drop.dur); this.placeTop(t); if (!this.landed && t > 0.55) { this.landed = true; this.splash(0.018); } if (t >= 1) { this.drop = null; this.placeTop(null); } }
    // hielo
    this.ICE.forEach((c, i) => {
      if (!c.m.visible) return; const base = this.level - 0.12 + c.p[1], bob = rm ? 0 : Math.sin(ts * 1.4 + i * 1.7) * 0.018;
      if (c.on) { const k = c.t0 < 0 ? 1 : cl((ts - c.t0) / 0.55, 0, 1); const y = k < 1 ? c.from + (base - c.from) * easeOut(k) : base + bob; c.m.position.set(c.p[0], y, c.p[2]); c.m.scale.setScalar(k <= 0 ? 0.001 : 1); if (c.t0 >= 0 && k >= 1 && !c.landed) { c.landed = true; this.splash(0.02); } if (k < 1) c.landed = false; c.m.rotation.y = i * 1.3 + (rm ? 0 : Math.sin(ts * 0.8 + i) * 0.15); }
      else { const k = c.t0 < 0 ? 1 : cl((ts - c.t0) / 0.25, 0, 1); c.m.scale.setScalar(Math.max(0.001, 1 - k)); if (k >= 1) c.m.visible = false; }
    });
    { const cg = build && !rm ? easeInOut(cl((now - build.start) / 1900, 0, 1)) : 1, orb = (1 - cg) * 0.6, dd = this.camD * (1 + (1 - cg) * 0.24); this.cam.position.set(Math.sin(orb) * dd, 3.1 + (1 - cg) * 1.9, Math.cos(orb) * dd); this.cam.lookAt(this.target); }
    this.condT += ((build ? 0 : this.iceK > 0 ? 1 : 0.4) - this.condT) * Math.min(1, dt * (build ? 6 : 0.9)); this.condMat.opacity = rm ? (build ? 0 : 0.8) : this.condT * 0.85; this.cond.visible = this.condMat.opacity > 0.01;
    if (this.sweep && !rm) { const k = (now - this.sweep) / 1500; if (k >= 1) { this.sweep = 0; this.glint.visible = false; } else { this.glint.visible = true; this.gTex.offset.x = 0.62 - k * 1.05; (this.glint.material as THREE.MeshBasicMaterial).opacity = 0.55 * Math.sin(PI * Math.min(1, k * 1.15)); } }
    cup.position.y = lift; cup.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6); this.shadow.scale.setScalar(1 - Math.min(0.4, Math.abs(lift) * 0.3));
    this.R.render(this.scene, this.cam); this.raf = requestAnimationFrame(this.frame);
  };
  private run() { cancelAnimationFrame(this.raf); this.t0 = performance.now(); this.raf = requestAnimationFrame(this.frame); }

  /** Monta el lienzo en `host` y arma la bebida desde cero. */
  mount(host: HTMLElement, d: DrinkLook, o: CupOpts) {
    this.host = host; if (this.canvas.parentNode !== host) host.appendChild(this.canvas);
    this.ro?.disconnect(); this.ro = new ResizeObserver(this.size); this.ro.observe(host); this.size();
    this.applyDrink(d); this.rot = -0.5; this.slosh.x = this.slosh.v = 0; this.swirl.x = this.swirl.v = 0; this.rip = 0; this.swapOut = null; this.drop = null; this.prevRot = this.rot; this.prevAV = 0;
    if (RM()) { this.setIce(o.ice, false); this.curTop = null; this.applyTop(o.top, false); this.level = this.levelTo; this.film.visible = true; this.strawG.visible = true; this.strawG.position.set(0, 0, 0); this.stream.visible = false; this.build = null; }
    else {
      this.ICE.forEach((c) => { c.on = false; c.m.visible = false; }); this.iceK = o.ice; this.levelTo = Math.min(TOP - 0.15, this.levelBase + [0.12, 0.06, 0][o.ice]);
      this.level = 0.14; this.curTop = null; this.pearls.visible = this.jelly.visible = false; this.film.visible = false; this.strawG.visible = false;
      this.build = { start: performance.now(), top: o.top, iceK: o.ice };
    }
    this.run();
  }
  /** Cambia de bebida con un giro completo (el vaso se vacía y se vuelve a llenar). */
  set(d: DrinkLook, o: CupOpts) {
    if (RM() || !this.cur) { this.applyDrink(d); this.setIce(o.ice, false); this.curTop = null; this.applyTop(o.top, false); return; }
    const full = PI * 2;
    this.spin = { from: this.rot, to: Math.ceil((this.rot + 0.2) / full) * full + full, start: performance.now(), dur: 1300, d, top: o.top, done: false };
    this.setIce(o.ice, true);
  }
  /** Aplica un cambio de opción; si la bebida se está armando, se aplica en el paso que corresponde. */
  opts(o: CupOpts, which: "top" | "ice" | "sweet") {
    if (this.build) { if (which === "top") { if (this.build.pearls) this.applyTop(o.top, true); else this.build.top = o.top; } if (which === "ice") { if (this.build.ice) this.setIce(o.ice, true); else this.build.iceK = o.ice; } return; }
    if (which === "top") this.setTop(o.top, true);
    if (which === "ice") this.setIce(o.ice, true);
    if (which === "sweet") this.splash(0.015);
  }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  dispose() { this.stop(); this.disposed = true; this.ro?.disconnect(); this.R.dispose(); }
}

let singleton: CupEngine | null | undefined;
/** Un solo vaso 3D por página (el lienzo se mueve entre fichas). */
export function getCup(): CupEngine | null {
  if (singleton === undefined) singleton = CupEngine.create();
  return singleton;
}
