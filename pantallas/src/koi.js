/* Koi visto desde arriba, nadando. Mismo lenguaje que la mascota: cuerpo blanco, manchas kohaku rojas
   y contorno de tinta redondeado. También estilo tinta (sumi-e) y sombra.
   Uso:
     const P = KT.koi.spine(pathFn, t, {len: 420});   // pathFn(tiempo) → {x, y}; debe ser periódica para loops
     KT.koi.draw(ctx, P, {style:'line', phase, seed});
*/
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2;
  const N = 16;
  const PROF = [0.66, 0.89, 0.98, 1.00, 1.00, 0.97, 0.92, 0.85, 0.76, 0.66, 0.55, 0.45, 0.36, 0.28, 0.21, 0.16];

  // columna vertebral: N puntos desde la cabeza hacia la cola, separados por len/(N-1)
  function spine(pathFn, t, o = {}) {
    const len = o.len || 420, seg = len / (N - 1), dt = o.dt || 0.025, K = o.samples || 220;
    const pts = [pathFn(t)];
    let prev = pts[0], acc = 0, k = 1, last = pts[0];
    while (pts.length < N && k < K) {
      const p = pathFn(t - k * dt); const d = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (acc + d >= seg) { const r = (seg - acc) / d; const q = { x: prev.x + (p.x - prev.x) * r, y: prev.y + (p.y - prev.y) * r }; pts.push(q); prev = q; acc = 0; }
      else { acc += d; prev = p; k++; }
      last = p;
    }
    while (pts.length < N) { // extrapola si el pez va muy lento
      const a = pts[pts.length - 1], b = pts[pts.length - 2] || { x: a.x - 1, y: a.y };
      let dx = a.x - b.x, dy = a.y - b.y; const l = Math.hypot(dx, dy);
      if (l < 1e-6) { const h = pathFn(t), h2 = pathFn(t - 0.2); dx = h.x - h2.x; dy = h.y - h2.y; const l2 = Math.hypot(dx, dy) || 1; dx = -dx / l2; dy = -dy / l2; } else { dx /= l; dy /= l; }
      pts.push({ x: a.x + dx * seg, y: a.y + dy * seg });
    }
    // tangentes y normales
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
      let tx = a.x - b.x, ty = a.y - b.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; // apunta hacia la cabeza
      return { x: p.x, y: p.y, tx, ty, nx: -ty, ny: tx };
    });
  }

  // aplica la ondulación lateral del nado (crece hacia la cola)
  function undulate(P, phase, amp) {
    return P.map((p, i) => {
      const u = i / (N - 1), w = amp * Math.pow(u, 1.35) * Math.sin(phase - u * 4.2);
      return Object.assign({}, p, { x: p.x + p.nx * w, y: p.y + p.ny * w });
    }).map((p, i, arr) => {
      const a = arr[Math.max(0, i - 1)], b = arr[Math.min(N - 1, i + 1)];
      let tx = a.x - b.x, ty = a.y - b.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      return { x: p.x, y: p.y, tx, ty, nx: -ty, ny: tx };
    });
  }

  function bodyPath(ctx, P, R) {
    const L = [], Rr = [];
    P.forEach((p, i) => { const w = PROF[i] * R; L.push([p.x + p.nx * w, p.y + p.ny * w]); Rr.push([p.x - p.nx * w, p.y - p.ny * w]); });
    const h = P[0], Rl = PROF[0] * R, Rf = R * 0.72;
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < L.length; i++) { const m = [(L[i - 1][0] + L[i][0]) / 2, (L[i - 1][1] + L[i][1]) / 2]; ctx.quadraticCurveTo(L[i - 1][0], L[i - 1][1], m[0], m[1]); }
    const e = P[N - 1]; ctx.lineTo(e.x + e.nx * PROF[N - 1] * R * 0.6, e.y + e.ny * PROF[N - 1] * R * 0.6);
    ctx.lineTo(e.x - e.nx * PROF[N - 1] * R * 0.6, e.y - e.ny * PROF[N - 1] * R * 0.6);
    for (let i = Rr.length - 1; i > 0; i--) { const m = [(Rr[i - 1][0] + Rr[i][0]) / 2, (Rr[i - 1][1] + Rr[i][1]) / 2]; ctx.quadraticCurveTo(Rr[i][0], Rr[i][1], m[0], m[1]); }
    ctx.lineTo(Rr[0][0], Rr[0][1]);
    // cabeza: media elipse desde el lado derecho, por la nariz, hasta el izquierdo
    for (let k = 1; k <= 12; k++) {
      const th = -Math.PI / 2 + (Math.PI * k) / 12, c = Math.cos(th), sn = Math.sin(th);
      ctx.lineTo(h.x + h.tx * c * Rf + h.nx * sn * Rl, h.y + h.ty * c * Rf + h.ny * sn * Rl);
    }
    ctx.closePath();
  }

  // aleta (pectoral o pélvica): forma de pétalo desde la base, ángulo relativo al cuerpo
  function finShape(ctx, x, y, ang, len, wid, side) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (side > 0) ctx.scale(1, -1);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.25, -wid * 0.9, len * 0.85, -wid * 0.75, len, -wid * 0.05);
    ctx.bezierCurveTo(len * 0.9, wid * 0.45, len * 0.4, wid * 0.5, 0, 0);
    ctx.closePath(); ctx.restore();
  }
  function finRays(ctx, x, y, ang, len, wid, side) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (side > 0) ctx.scale(1, -1); ctx.beginPath();
    for (let k = 0; k < 3; k++) { const f = -0.45 + k * 0.32; ctx.moveTo(len * 0.12, wid * f * 0.25); ctx.quadraticCurveTo(len * 0.5, wid * f * 0.9 - wid * 0.15, len * (0.72 + k * 0.05), wid * f * 0.6 - wid * 0.2); }
    ctx.restore();
  }
  // cola de dos lóbulos
  function tailPath(ctx, e, q, ang, L, W) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-L * 0.08, 0);
    ctx.bezierCurveTo(L * 0.3, -W * 0.15, L * 0.62, -W * 0.95, L * 1.0, -W * 0.9);
    ctx.quadraticCurveTo(L * 0.72, -W * 0.25, L * 0.8, 0);
    ctx.quadraticCurveTo(L * 0.72, W * 0.25, L * 1.0, W * 0.9);
    ctx.bezierCurveTo(L * 0.62, W * 0.95, L * 0.3, W * 0.15, -L * 0.08, 0);
    ctx.closePath(); ctx.restore();
  }
  function tailRays(ctx, e, ang, L, W) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(ang); ctx.beginPath();
    for (let k = -2; k <= 2; k++) { ctx.moveTo(L * 0.1, k * W * 0.04); ctx.quadraticCurveTo(L * 0.5, k * W * 0.2, L * 0.86, k * W * 0.36); }
    ctx.restore();
  }

  // manchas kohaku por semilla: [{i (posición en la columna), off (lateral -1..1), r (relativo a R), s (semilla de forma)}]
  // 2–3 manchas orgánicas: cabeza (0–2) y lomo (5–9); nada en la cola.
  function patches(seed) {
    if (seed === 'mascot') return [{ i: 0.9, off: 0.12, r: 0.92, s: 1.3 }, { i: 5.6, off: -0.18, r: 0.95, s: 4.1 }, { i: 8.6, off: 0.2, r: 0.55, s: 2.2 }];
    const R = KT.rng(1000 + seed * 17), out = [{ i: 0.7 + R() * 0.7, off: (R() - 0.5) * 0.4, r: 0.8 + R() * 0.25, s: R() * 6 }];
    const n = 1 + Math.floor(R() * 2);
    for (let k = 0; k < n; k++) out.push({ i: 4.8 + k * 2.6 + R() * 1.2, off: (R() - 0.5) * 0.7, r: 0.6 + R() * 0.35, s: R() * 6 });
    return out;
  }
  // mancha orgánica alargada en la dirección del cuerpo
  function blob(ctx, x, y, rx, ry, ang, sd) {
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const th = (k / 30) * TAU, rr = 1 + 0.17 * Math.sin(3 * th + sd) + 0.09 * Math.sin(5 * th + sd * 1.7) + 0.05 * Math.sin(8 * th + sd * 0.3);
      const px = Math.cos(th) * rx * rr, py = Math.sin(th) * ry * rr;
      const X = x + px * Math.cos(ang) - py * Math.sin(ang), Y = y + px * Math.sin(ang) + py * Math.cos(ang);
      k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath();
  }
  function patchPos(P, pt, R, k) {
    const i = Math.min(N - 1, Math.floor(pt.i)), f = pt.i - i, a = P[i], b = P[Math.min(N - 1, i + 1)];
    return { x: a.x + (b.x - a.x) * f + a.nx * pt.off * R * k, y: a.y + (b.y - a.y) * f + a.ny * pt.off * R * k, ang: Math.atan2(a.ty, a.tx) };
  }

  /* o: {style:'line'|'ink'|'shadow', R (medio ancho máx.), phase (rad, nado), amp, seed, lw, line, body, red, alpha,
         fin (rad aleteo), tailSwing, shadow: {dx, dy, alpha}} */
  function draw(ctx, P0, o = {}) {
    const R = o.R || 52, style = o.style || 'line', phase = o.phase || 0;
    const P = undulate(P0, phase, o.amp == null ? R * 0.42 : o.amp);
    const line = o.line || KT.C.ink, body = o.body || '#FFFFFF', red = o.red || KT.C.koi;
    const lw = o.lw || Math.max(2, R * 0.11);
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    const flap = o.fin == null ? Math.sin(phase * 0.5) * 0.22 : o.fin;
    const e = P[N - 1], q = P[N - 3];
    const tailAng = Math.atan2(e.y - q.y, e.x - q.x) + Math.sin(phase - 4.6) * (o.tailSwing == null ? 0.32 : o.tailSwing);
    const fins = [[3, 1, 1.15], [3, -1, 1.15], [8, 1, 0.62], [8, -1, 0.62]];
    const finGeo = ([i, s, k]) => {
      const p = P[i], w = PROF[i] * R * 0.82, back = Math.atan2(-p.ty, -p.tx);
      const ang = back - s * (k > 1 ? 1.0 : 0.75) - s * flap * (k > 1 ? 1 : 0.6);
      return [p.x + p.nx * w * s, p.y + p.ny * w * s, ang, R * 1.45 * k, R * 0.66 * k, s];
    };

    if (style === 'shadow') {
      ctx.fillStyle = o.color || 'rgba(30,40,35,0.18)';
      fins.forEach(f => { const g = finGeo(f); finShape(ctx, g[0], g[1], g[2], g[3], g[4], g[5]); ctx.fill(); });
      tailPath(ctx, e, q, tailAng, R * 2.1, R * 1.25); ctx.fill();
      bodyPath(ctx, P, R); ctx.fill();
      ctx.globalAlpha = a0; return P;
    }

    if (style === 'ink') {
      const ink = o.ink || KT.C.ink, h = P[0];
      // aletas y cola: aguadas grises con estrías de pincel
      fins.forEach(f => { const g = finGeo(f); finShape(ctx, g[0], g[1], g[2], g[3], g[4], g[5]); ctx.fillStyle = KT.rgba(ink, 0.10); ctx.fill(); ctx.strokeStyle = KT.rgba(ink, 0.28); ctx.lineWidth = lw * 0.5; finRays(ctx, g[0], g[1], g[2], g[3], g[4], g[5]); ctx.stroke(); });
      tailPath(ctx, e, q, tailAng, R * 2.2, R * 1.3); ctx.fillStyle = KT.rgba(ink, 0.09); ctx.fill();
      ctx.strokeStyle = KT.rgba(ink, 0.26); ctx.lineWidth = lw * 0.5; tailRays(ctx, e, tailAng, R * 2.2, R * 1.3); ctx.stroke();
      // cuerpo: papel claro con volumen de tinta en el lomo
      bodyPath(ctx, P, R); ctx.fillStyle = KT.rgba(o.body || '#FFFDF8', 0.92); ctx.fill();
      const gr = ctx.createLinearGradient(h.x + h.tx * R, h.y + h.ty * R, e.x, e.y);
      gr.addColorStop(0, KT.rgba(ink, 0.22)); gr.addColorStop(0.5, KT.rgba(ink, 0.08)); gr.addColorStop(1, KT.rgba(ink, 0.02));
      ctx.fillStyle = gr; ctx.fill();
      // manchas rojas en acuarela (capas translúcidas)
      ctx.save(); bodyPath(ctx, P, R * 0.86); ctx.clip();
      patches(o.seed == null ? 'mascot' : o.seed).forEach((pt, j) => {
        const q = patchPos(P, pt, R, 0.6);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = KT.rgba(red, 0.3); blob(ctx, q.x + Math.cos(k * 2.1 + j) * R * 0.06, q.y + Math.sin(k * 2.1 + j) * R * 0.06, pt.r * R * (1.25 - k * 0.12), pt.r * R * (0.8 - k * 0.08), q.ang, pt.s + k); ctx.fill(); }
      });
      ctx.restore();
      // contorno de pincel: halo suave + línea
      bodyPath(ctx, P, R); ctx.strokeStyle = KT.rgba(ink, 0.18); ctx.lineWidth = lw * 2.2; ctx.stroke();
      ctx.strokeStyle = KT.rgba(ink, 0.78); ctx.lineWidth = lw * 0.7; ctx.stroke();
      // ojos
      [1, -1].forEach(sd => { ctx.fillStyle = KT.rgba(ink, 0.9); ctx.beginPath(); ctx.arc(h.x + h.tx * R * 0.1 + h.nx * R * 0.58 * sd, h.y + h.ty * R * 0.1 + h.ny * R * 0.58 * sd, Math.max(1.5, R * 0.085), 0, TAU); ctx.fill(); });
      ctx.globalAlpha = a0; return P;
    }

    // estilo línea (como la mascota)
    if (o.shadow !== false) {
      const sh = o.shadow || {}; ctx.save(); ctx.translate(sh.dx == null ? R * 0.35 : sh.dx, sh.dy == null ? R * 0.55 : sh.dy);
      ctx.fillStyle = KT.rgba(sh.color || '#2A3A33', sh.alpha == null ? 0.13 : sh.alpha);
      fins.forEach(f => { const g = finGeo(f); finShape(ctx, g[0], g[1], g[2], g[3], g[4], g[5]); ctx.fill(); });
      tailPath(ctx, e, q, tailAng, R * 2.1, R * 1.25); ctx.fill(); bodyPath(ctx, P, R); ctx.fill(); ctx.restore();
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fins.forEach(f => {
      const g = finGeo(f); finShape(ctx, g[0], g[1], g[2], g[3], g[4], g[5]);
      ctx.fillStyle = o.finFill || KT.rgba(body, 0.94); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw * 0.8; ctx.stroke();
      ctx.lineWidth = lw * 0.45; ctx.strokeStyle = KT.rgba(line, 0.55); finRays(ctx, g[0], g[1], g[2], g[3], g[4], g[5]); ctx.stroke();
    });
    tailPath(ctx, e, q, tailAng, R * 2.1, R * 1.25);
    ctx.fillStyle = o.finFill || KT.rgba(body, 0.94); ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw * 0.8; ctx.stroke();
    ctx.lineWidth = lw * 0.45; ctx.strokeStyle = KT.rgba(line, 0.5); tailRays(ctx, e, tailAng, R * 2.1, R * 1.25); ctx.stroke();
    bodyPath(ctx, P, R); ctx.fillStyle = body; ctx.fill();
    ctx.save(); bodyPath(ctx, P, R * 0.85); ctx.clip(); ctx.fillStyle = red; // margen blanco (kiwa) hacia el contorno
    patches(o.seed == null ? 'mascot' : o.seed).forEach(pt => {
      const q = patchPos(P, pt, R, 0.55);
      blob(ctx, q.x, q.y, pt.r * R * 1.3, pt.r * R * 0.86, q.ang, pt.s); ctx.fill();
    });
    ctx.restore();
    bodyPath(ctx, P, R); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke();
    // aleta dorsal como línea sobre el lomo
    ctx.beginPath(); ctx.moveTo(P[4].x, P[4].y); for (let i = 5; i <= 9; i++) ctx.lineTo(P[i].x, P[i].y);
    ctx.strokeStyle = KT.rgba(line, 0.28); ctx.lineWidth = lw * 0.5; ctx.stroke();
    // ojos y barbillas
    const h = P[0];
    [1, -1].forEach(s => {
      ctx.fillStyle = line; ctx.beginPath(); ctx.arc(h.x + h.tx * R * 0.1 + h.nx * R * 0.6 * s, h.y + h.ty * R * 0.1 + h.ny * R * 0.6 * s, Math.max(1.5, R * 0.1), 0, TAU); ctx.fill();
      const bx = h.x + h.tx * R * 0.48 + h.nx * R * 0.2 * s, by = h.y + h.ty * R * 0.48 + h.ny * R * 0.2 * s;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + h.tx * R * 0.25 + h.nx * R * 0.25 * s, by + h.ty * R * 0.25 + h.ny * R * 0.25 * s, bx + h.tx * R * 0.1 + h.nx * R * 0.5 * s, by + h.ty * R * 0.1 + h.ny * R * 0.5 * s);
      ctx.strokeStyle = line; ctx.lineWidth = lw * 0.5; ctx.stroke();
    });
    ctx.globalAlpha = a0;
    return P;
  }

  // trayectorias periódicas útiles (periodo L segundos)
  const paths = {
    // lazo tipo Lissajous dentro de una caja (cx, cy, rx, ry), a vueltas por loop
    loop: (cx, cy, rx, ry, L, a = 1, b = 2, ph = 0) => t => ({ x: cx + rx * Math.sin((TAU * a * t) / L + ph), y: cy + ry * Math.sin((TAU * b * t) / L + ph * 0.7) }),
    // círculo / óvalo
    orbit: (cx, cy, rx, ry, L, turns = 1, ph = 0, dir = 1) => t => ({ x: cx + rx * Math.cos(dir * (TAU * turns * t) / L + ph), y: cy + ry * Math.sin(dir * (TAU * turns * t) / L + ph) }),
    // cruce lineal de x0 a x1 durante [t0, t1] con ondulación suave; fuera de ese tramo queda fuera de cuadro
    cross: (x0, y0, x1, y1, t0, t1, wav = 60, L = 1) => t => { const u = (t - t0) / (t1 - t0); return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u + wav * Math.sin(u * TAU * 1.2) }; }
  };

  // ruta periódica por puntos con tiempo: [{t, x, y}], periodo L. Hermite cúbica en el tiempo: pasa por cada punto a
  // su hora y la velocidad en cada punto es (siguiente − anterior) / (tiempo entre ellos), así no hay tirones aunque
  // los tramos duren distinto.
  paths.route = function (pts, L) {
    const P = pts.slice().sort((a, b) => a.t - b.t), n = P.length;
    const T = i => P[((i % n) + n) % n].t + Math.floor(i / n) * L;          // tiempo desenrollado del punto i
    const Q = i => P[((i % n) + n) % n];
    const vel = i => { const a = Q(i - 1), c = Q(i + 1), dt = T(i + 1) - T(i - 1); return { x: (c.x - a.x) / dt, y: (c.y - a.y) / dt }; };
    const V = P.map((_, i) => vel(i));
    return function (t) {
      const tt = ((t % L) + L) % L;
      let i = n - 1; for (let k = 0; k < n; k++) { if (P[k].t > tt) { i = k - 1; break; } }
      if (i < 0) i = n - 1;
      const t1 = T(i), t2 = T(i + 1); let x = tt; if (x < t1) x += L;
      const h = t2 - t1, u = (x - t1) / h, u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      const p1 = Q(i), p2 = Q(i + 1), m1 = V[i], m2 = V[(i + 1) % n];
      return { x: h00 * p1.x + h10 * h * m1.x + h01 * p2.x + h11 * h * m2.x, y: h00 * p1.y + h10 * h * m1.y + h01 * p2.y + h11 * h * m2.y };
    };
  };

  KT.koi = { N, PROF, spine, undulate, draw, paths, bodyPath, patches };
})();
