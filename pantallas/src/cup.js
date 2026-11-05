/* Vaso de Koi Tea en el lenguaje de la mascota: contorno de tinta, colores planos en capas con frontera dibujada
   a mano, perlas como puntos de tinta (como en el logo), tapa sellada con película impresa y toppings planos.
   KT.cup(ctx, cx, baseY, H, o) — base del vaso en (cx, baseY), alto H. */
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2, clamp = KT.clamp;
  const geo = H => ({ tw: H * 0.66, bw: H * 0.47, h: H, ry: H * 0.66 * 0.09 });

  // capas planas a partir de las paradas de color: cada color ocupa hasta la mitad del camino a la siguiente parada
  function bands(layers) {
    const L = layers.slice().sort((a, b) => a[0] - b[0]), out = [];
    for (let i = 0; i < L.length; i++) {
      const lo = i === 0 ? 0 : (L[i - 1][0] + L[i][0]) / 2, hi = i === L.length - 1 ? 1 : (L[i][0] + L[i + 1][0]) / 2;
      if (hi > lo) out.push([lo, hi, L[i][1]]);
    }
    return out;
  }

  /* o: {drink, layers, fill (0→1), drop (0→1), top: {type, color}, ice, straw (color|false), strawAng, wave (rad), seed, lw, line, film, floorShadow} */
  KT.cup = function (ctx, cx, by, H, o = {}) {
    const G = geo(H), top = by - G.h, ink = o.line || KT.C.ink, lw = o.lw || Math.max(4, H * 0.013);
    const fill = o.fill == null ? 1 : clamp(o.fill), drop = o.drop == null ? 1 : clamp(o.drop);
    const d = o.drink || {}, layers = o.layers || d.layers || [[0, d.c1 || KT.C.milk], [1, d.c2 || d.c1 || KT.C.milk]];
    const wv = o.wave || 0, R = KT.rng(o.seed || 5);
    const halfW = u => G.bw / 2 + (G.tw / 2 - G.bw / 2) * u;        // medio ancho interior a la altura u (0 base → 1 borde)
    const cupPath = inset => {
      ctx.beginPath();
      ctx.moveTo(cx - G.tw / 2 + inset, top + G.ry * 0.2);
      ctx.lineTo(cx - G.bw / 2 + inset, by - H * 0.03);
      ctx.quadraticCurveTo(cx - G.bw / 2 + inset, by - inset * 0.5, cx - G.bw / 2 + inset + H * 0.04, by - inset * 0.5);
      ctx.lineTo(cx + G.bw / 2 - inset - H * 0.04, by - inset * 0.5);
      ctx.quadraticCurveTo(cx + G.bw / 2 - inset, by - inset * 0.5, cx + G.bw / 2 - inset, by - H * 0.03);
      ctx.lineTo(cx + G.tw / 2 - inset, top + G.ry * 0.2);
      ctx.closePath();
    };
    // frontera ondulada a la altura y
    const wavy = (y, amp, ph) => { const pts = []; for (let k = 0; k <= 16; k++) { const x = cx - G.tw / 2 - 10 + ((G.tw + 20) * k) / 16; pts.push([x, y + Math.sin(ph + k * 0.9) * amp + Math.sin(ph * 0.7 + k * 2.3) * amp * 0.35]); } return pts; };
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.floorShadow !== false) { ctx.fillStyle = KT.rgba(ink, 0.08); ctx.beginPath(); ctx.ellipse(cx, by + lw * 0.6, G.bw * 0.72, H * 0.025, 0, 0, TAU); ctx.fill(); }
    // vaso (pared trasera, plana)
    cupPath(0); ctx.fillStyle = o.cupFill || 'rgba(255,255,255,0.88)'; ctx.fill();

    // líquido en capas planas
    const maxU = 0.92, lvlU = maxU * KT.E.inOutCubic(fill), lvlY = by - G.h * lvlU;
    if (fill > 0) {
      ctx.save(); cupPath(lw * 0.5); ctx.clip();
      const B = bands(layers), Hl = G.h * maxU;
      B.forEach(([lo, hi, col], i) => {
        const y0 = by - Hl * lo + 2, y1 = Math.max(lvlY, by - Hl * hi);
        if (y1 >= y0) return;
        const edge = i === B.length - 1 || by - Hl * hi <= lvlY ? wavy(y1, H * 0.006, wv) : wavy(y1, H * 0.012, wv * 0.6 + i * 1.7);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - G.tw, y0 + 4);
        edge.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(cx + G.tw, y0 + 4); ctx.closePath(); ctx.fill();
      });
      // azúcar morena: vetas diagonales desde el borde que adelgazan
      if (d.k === 'brown' || o.tiger) {
        const syrup = d.c2 || '#5A2E14';
        for (let k = 0; k < 5; k++) {
          const u = (k + 0.5) / 5, x0 = cx - G.tw * 0.42 + u * G.tw * 0.84, len = G.h * (0.35 + KT.hash(k * 3.1 + 2) * 0.2) * Math.min(1, fill * 1.2), dir = k % 2 ? 1 : -1;
          const pts = KT.cubicPts([x0, lvlY + 2], [x0 + dir * H * 0.03, lvlY + len * 0.35], [x0 + dir * H * 0.07, lvlY + len * 0.7], [x0 + dir * H * 0.06, lvlY + len], 24);
          KT.brush(ctx, pts, 1, { w: H * 0.05, color: syrup, taperIn: 0.02, taperOut: 0.9, alpha: 0.8 });
        }
      }
      // hielo: cubos con contorno
      if (o.ice) {
        for (let k = 0; k < 4; k++) {
          const s = H * (0.12 + 0.025 * KT.hash(k * 5)), x = cx - G.tw * 0.26 + KT.hash(k * 7 + 1) * G.tw * 0.52, y = lvlY + H * 0.07 + KT.hash(k * 11) * H * 0.12 + Math.sin(wv + k) * H * 0.004;
          if (y > by - H * 0.2) continue;
          ctx.save(); ctx.translate(x, y); ctx.rotate((KT.hash(k * 3) - 0.5) * 0.9);
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); KT.rr(ctx, -s / 2, -s / 2, s, s, s * 0.16); ctx.fill();
          ctx.strokeStyle = KT.rgba(ink, 0.45); ctx.lineWidth = lw * 0.4; ctx.stroke(); ctx.restore();
        }
      }
      ctx.restore();
    }

    // toppings planos (caen con drop)
    const tp = o.top || d.top || { type: 'tapioca' };
    if (tp && tp.type && drop > 0) {
      ctx.save(); cupPath(lw * 0.6); ctx.clip();
      const r = H * (tp.type === 'tapioca' ? 0.046 : 0.042), cols = 5, count = tp.count || (tp.type === 'jelly' ? 8 : 9);
      for (let k = 0; k < count; k++) {
        const row = Math.floor(k / cols), col = k % cols, n = Math.min(cols, count - row * cols);
        const span = halfW(0.05 + row * 0.06) * 2 - r * 2.6, u = n > 1 ? col / (n - 1) - 0.5 : 0;
        const xx = cx + u * span * (row % 2 ? 0.86 : 1) + (R() - 0.5) * r * 0.25, yy = by - r * 1.2 - row * r * 1.7 - R() * r * 0.2;
        const dk = KT.E.outCubic(clamp((drop - k * 0.03) / 0.45)); if (dk <= 0) continue;
        const y = (top - r * 2) + (yy - (top - r * 2)) * dk;
        if (tp.type === 'tapioca') { ctx.fillStyle = tp.color || KT.C.pearl; ctx.beginPath(); ctx.arc(xx, y, r, 0, TAU); ctx.fill(); }
        else if (tp.type === 'pop') { ctx.fillStyle = tp.color || '#F4DCD6'; ctx.beginPath(); ctx.arc(xx, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = KT.rgba(ink, 0.55); ctx.lineWidth = lw * 0.35; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(xx - r * 0.35, y - r * 0.35, r * 0.18, 0, TAU); ctx.fill(); }
        else { const s = r * 1.75; ctx.save(); ctx.translate(xx, y); ctx.rotate((R() - 0.5) * 0.7); ctx.fillStyle = KT.rgba(tp.color || '#F2ECE2', 0.92); ctx.beginPath(); KT.rr(ctx, -s / 2, -s / 2, s, s, s * 0.2); ctx.fill(); ctx.strokeStyle = KT.rgba(ink, 0.5); ctx.lineWidth = lw * 0.35; ctx.stroke(); ctx.restore(); }
      }
      ctx.restore();
    }

    // contorno de tinta
    cupPath(0); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke();

    // tapa sellada con película impresa (olas en tinta y un koi pequeño)
    if (o.film !== false) {
      ctx.save(); ctx.translate(cx, top + G.ry * 0.2);
      ctx.fillStyle = o.filmColor || '#FBF6EE'; ctx.beginPath(); ctx.ellipse(0, 0, G.tw / 2 + lw * 0.6, G.ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = lw * 0.85; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, G.tw / 2 - lw, G.ry * 0.75, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = KT.rgba(ink, 0.45); ctx.lineWidth = Math.max(1.5, lw * 0.3);
      for (let k = 0; k < 2; k++) { ctx.beginPath(); const yy = -G.ry * 0.05 + k * G.ry * 0.38; ctx.moveTo(-G.tw * 0.34, yy); ctx.bezierCurveTo(-G.tw * 0.12, yy - G.ry * 0.45, G.tw * 0.08, yy + G.ry * 0.45, G.tw * 0.32, yy - G.ry * 0.05); ctx.stroke(); }
      ctx.fillStyle = KT.rgba(KT.C.koi, 0.85); ctx.beginPath(); ctx.ellipse(G.tw * 0.18, -G.ry * 0.28, G.tw * 0.045, G.ry * 0.16, 0, 0, TAU); ctx.fill();
      ctx.restore(); ctx.restore();
    }
    // popote ancho
    if (o.straw) {
      const sx = cx + G.tw * 0.12, sy = top + G.ry * 0.2, ang = o.strawAng == null ? 0.2 : o.strawAng, L = H * (o.strawLen || 0.34), w = H * 0.065;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
      ctx.fillStyle = typeof o.straw === 'string' ? o.straw : KT.C.koiDeep;
      ctx.beginPath(); KT.rr(ctx, -w / 2, -L, w, L + H * 0.02, w * 0.18); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = lw * 0.7; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return { top, tw: G.tw, bw: G.bw, ry: G.ry };
  };
  KT.cupGeo = geo;
})();
