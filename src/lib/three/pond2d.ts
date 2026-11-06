/** Estanque de respaldo en Canvas 2D (para navegadores sin WebGL): dos koi dibujados que nadan en rutas suaves. */
export class Pond2D {
  private ctx: CanvasRenderingContext2D;
  private raf = 0; private on = false; private ro: ResizeObserver;
  private static PROF = [0.62, 0.86, 1, 1, 0.96, 0.88, 0.78, 0.67, 0.56, 0.45, 0.36, 0.28, 0.21, 0.15, 0.1];
  constructor(private cv: HTMLCanvasElement) {
    this.ctx = cv.getContext("2d")!;
    this.ro = new ResizeObserver(() => this.size()); this.ro.observe(cv);
  }
  private size() { const r = this.cv.getBoundingClientRect(), dp = Math.min(devicePixelRatio || 1, 2); this.cv.width = Math.round(r.width * dp); this.cv.height = Math.round(r.height * dp); }
  private pts(t: number, W: number, H: number, ph: number, sc: number) {
    const path = (s: number) => ({ x: W * 0.5 + W * 0.42 * Math.sin(s * 0.31 + ph) + W * 0.06 * Math.sin(s * 1.1), y: H * 0.42 + H * 0.26 * Math.sin(s * 0.23 + ph * 2) });
    const h: { x: number; y: number }[] = []; for (let k = 0; k < 160; k++) h.push(path(t - k * 0.04));
    const seg = 11 * sc, out = [h[0]]; let acc = 0, j = 1, pr = h[0];
    while (out.length < 15 && j < h.length) { const p = h[j], dd = Math.hypot(p.x - pr.x, p.y - pr.y); if (acc + dd >= seg) { const r = (seg - acc) / dd, q = { x: pr.x + (p.x - pr.x) * r, y: pr.y + (p.y - pr.y) * r }; out.push(q); pr = q; acc = 0; } else { acc += dd; pr = p; j++; } }
    while (out.length < 15) { const a = out[out.length - 1]; out.push({ x: a.x + 1, y: a.y }); }
    return out.map((p, i) => { const a = out[Math.max(0, i - 1)], b = out[Math.min(14, i + 1)]; let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; const w = Math.sin(t * 5 - i * 0.55) * (1 + i * 0.6) * sc * 0.4; return { x: p.x - ty * w, y: p.y + tx * w, tx, ty, nx: -ty, ny: tx }; });
  }
  private body(P: ReturnType<Pond2D["pts"]>, R: number) {
    const ctx = this.ctx, L: number[][] = [], Q: number[][] = [];
    P.forEach((p, i) => { const w = Pond2D.PROF[i] * R; L.push([p.x + p.nx * w, p.y + p.ny * w]); Q.push([p.x - p.nx * w, p.y - p.ny * w]); });
    ctx.beginPath(); ctx.moveTo(P[0].x - P[0].tx * R * 0.7, P[0].y - P[0].ty * R * 0.7); L.forEach((q) => ctx.lineTo(q[0], q[1])); ctx.lineTo(P[14].x, P[14].y); for (let i = Q.length - 1; i >= 0; i--) ctx.lineTo(Q[i][0], Q[i][1]); ctx.closePath();
  }
  private koi(P: ReturnType<Pond2D["pts"]>, R: number, t: number, lw: number) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(6 * lw, 9 * lw); this.body(P, R); ctx.fillStyle = "rgba(30,60,50,.12)"; ctx.fill(); ctx.restore();
    ([[2, 1], [2, -1]] as const).forEach(([i, s]) => { const p = P[i], w = Pond2D.PROF[i] * R; ctx.save(); ctx.translate(p.x + p.nx * w * s, p.y + p.ny * w * s); ctx.rotate(Math.atan2(p.ty, p.tx) + s * (0.9 + Math.sin(t * 3.4) * 0.25)); ctx.beginPath(); ctx.ellipse(R * 0.9, 0, R * 0.95, R * 0.38, 0, 0, 7); ctx.fillStyle = "#FFFDF9"; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = "#27211E"; ctx.stroke(); ctx.restore(); });
    const e = P[14], q = P[12]; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(e.y - q.y, e.x - q.x) + Math.sin(t * 5 - 8) * 0.35); ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(R * 1.2, -R * 1.4, R * 2, -R * 1.1); ctx.quadraticCurveTo(R * 1.4, 0, R * 2, R * 1.1); ctx.quadraticCurveTo(R * 1.2, R * 1.4, -2, 0); ctx.fillStyle = "#FFFDF9"; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = "#27211E"; ctx.stroke(); ctx.restore();
    this.body(P, R); ctx.fillStyle = "#FFFDF9"; ctx.fill(); ctx.save(); this.body(P, R); ctx.clip(); ctx.fillStyle = "#F94E2B";
    ([[0, 2, 0.75], [1, -2, 0.8], [5, 3, 0.7], [6, -3, 0.55], [9, 1, 0.4]] as const).forEach(([i, o, r]) => { const p = P[i]; ctx.beginPath(); ctx.arc(p.x + p.nx * o * lw, p.y + p.ny * o * lw, R * r, 0, 7); ctx.fill(); }); ctx.restore();
    this.body(P, R); ctx.lineWidth = lw; ctx.strokeStyle = "#27211E"; ctx.lineJoin = "round"; ctx.stroke();
    const h = P[0]; [1, -1].forEach((s) => { ctx.beginPath(); ctx.arc(h.x - h.tx * R * 0.3 + h.nx * R * 0.5 * s, h.y - h.ty * R * 0.3 + h.ny * R * 0.5 * s, lw * 1.1, 0, 7); ctx.fillStyle = "#27211E"; ctx.fill(); });
  }
  private frame = (now: number) => {
    const ctx = this.ctx, cv = this.cv, t = now / 1000, W = cv.width, H = cv.height, dp = W / (cv.clientWidth || 1);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#D9E7DE"); g.addColorStop(1, "#A8C3B6"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.5 * dp;
    for (let k = 0; k < 6; k++) { const per = 5, ph = ((t + k * 0.9) % per) / per, cy = Math.floor((t + k * 0.9) / per), x = ((Math.sin(k * 91 + cy * 13) + 1) / 2) * W, y = ((Math.sin(k * 37 + cy * 7) + 1) / 2) * H * 0.8; ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(x, y, ph * 90 * dp, ph * 36 * dp, 0, 0, 7); ctx.stroke(); }
    ([[0.82, 0.2, 28], [0.12, 0.78, 22], [0.9, 0.86, 18]] as const).forEach(([x, y, r], i) => { ctx.save(); ctx.translate(x * W, y * H); ctx.rotate(t * 0.05 + i); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * dp, 0.25, Math.PI * 2 - 0.05); ctx.closePath(); ctx.fillStyle = "rgba(98,140,112,.55)"; ctx.fill(); ctx.restore(); });
    this.koi(this.pts(t, W, H, 0, dp), 9 * dp, t, 1.6 * dp); this.koi(this.pts(t * 0.8 + 40, W, H, 2.2, dp * 0.8), 7 * dp, t, 1.3 * dp);
    if (this.on) this.raf = requestAnimationFrame(this.frame);
  };
  start() { if (this.on) return; this.on = true; this.size(); this.raf = requestAnimationFrame(this.frame); }
  stop() { this.on = false; cancelAnimationFrame(this.raf); }
  dispose() { this.stop(); this.ro.disconnect(); }
}
