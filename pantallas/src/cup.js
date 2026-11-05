/* Vaso de Koi Tea: plástico transparente, tapa sellada con película impresa (como en la foto de los fruit teas),
   líquido en capas, toppings, hielo y popote ancho opcional.
   KT.cup(ctx, cx, baseY, H, o) — base del vaso en (cx, baseY), alto H. */
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2;
  const geo = H => ({ tw: H * 0.66, bw: H * 0.47, h: H, ry: H * 0.66 * 0.09 });

  // o: {drink (de KT.MENU) o colores: layers:[[pos 0..1, color]], fill (0→1), drop (0→1 toppings), top: {type:'tapioca'|'pop'|'jelly', color},
  //     ice (bool), straw (color|false), style:'soft'|'line', film: true, seed, wave (rad), sweat (0..1), lw, line}
  KT.cup = function (ctx, cx, by, H, o = {}) {
    const G = geo(H), top = by - G.h, style = o.style || 'soft', line = o.line || KT.C.ink;
    const lw = o.lw || Math.max(2, H * 0.012);
    const fill = o.fill == null ? 1 : KT.clamp(o.fill), drop = o.drop == null ? 1 : KT.clamp(o.drop);
    const d = o.drink || {};
    const layers = o.layers || d.layers || [[0, d.c1 || KT.C.milk], [1, d.c2 || d.c1 || KT.C.milk]];
    const wall = (u) => G.bw / 2 + (G.tw / 2 - G.bw / 2) * u; // medio ancho a la altura u (0 base → 1 borde)
    const cupPath = (inset) => {
      ctx.beginPath();
      ctx.moveTo(cx - G.tw / 2 + inset, top + G.ry * 0.2);
      ctx.lineTo(cx - G.bw / 2 + inset, by - H * 0.02);
      ctx.quadraticCurveTo(cx - G.bw / 2 + inset, by, cx - G.bw / 2 + inset + H * 0.03, by);
      ctx.lineTo(cx + G.bw / 2 - inset - H * 0.03, by);
      ctx.quadraticCurveTo(cx + G.bw / 2 - inset, by, cx + G.bw / 2 - inset, by - H * 0.02);
      ctx.lineTo(cx + G.tw / 2 - inset, top + G.ry * 0.2);
      ctx.closePath();
    };
    ctx.save();
    // sombra al piso
    if (o.floorShadow !== false) {
      const sg = ctx.createRadialGradient(cx, by, 0, cx, by, G.bw * 0.9);
      sg.addColorStop(0, 'rgba(60,40,25,0.22)'); sg.addColorStop(1, 'rgba(60,40,25,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(cx, by + H * 0.005, G.bw * 0.9, G.bw * 0.16, 0, 0, TAU); ctx.fill();
    }
    // cuerpo del vaso (pared trasera)
    cupPath(0); ctx.fillStyle = style === 'line' ? (o.cupFill || 'rgba(255,255,255,0.92)') : 'rgba(255,255,255,0.28)'; ctx.fill();

    // líquido
    const maxU = 0.93, lvlU = maxU * KT.E.inOutCubic(fill), lvlY = by - G.h * lvlU;
    if (fill > 0) {
      ctx.save(); cupPath(H * 0.012); ctx.clip();
      const gr = ctx.createLinearGradient(0, by, 0, by - G.h * maxU);
      layers.forEach(([pos, c]) => gr.addColorStop(KT.clamp(pos), c));
      ctx.fillStyle = gr;
      const wv = o.wave || 0, amp = H * 0.008 * (fill < 1 ? 1 : 0.4);
      ctx.beginPath(); ctx.moveTo(cx - G.tw, by + 5);
      for (let k = 0; k <= 20; k++) { const x = cx - G.tw / 2 + (G.tw * k) / 20; ctx.lineTo(x, lvlY + Math.sin(wv + k * 0.7) * amp); }
      ctx.lineTo(cx + G.tw, by + 5); ctx.closePath(); ctx.fill();
      // vetas de azúcar morena ("tiger"): cortinas onduladas, gruesas arriba y delgadas abajo
      if (d.k === 'brown' || o.tiger) {
        const syrup = d.c2 || '#5A2E14';
        for (let k = 0; k < 7; k++) {
          const u = (k + 0.5) / 7, x0 = cx - G.tw * 0.44 + u * G.tw * 0.88 + (KT.hash(k * 5.3) - 0.5) * H * 0.04;
          const len = G.h * (0.42 + KT.hash(k + 3) * 0.36), y0 = lvlY + H * 0.005, sw = H * (0.05 + KT.hash(k * 2.1) * 0.06) * (k % 2 ? 1 : -1);
          const pts = KT.cubicPts([x0, y0], [x0 + sw, y0 + len * 0.28], [x0 - sw, y0 + len * 0.62], [x0 + sw * 0.5, Math.min(by - 8, y0 + len)], 30);
          KT.brush(ctx, pts, 1, { w: H * (0.04 + KT.hash(k * 7.7) * 0.035), color: syrup, taperIn: 0.02, taperOut: 0.8, alpha: 0.5 + KT.hash(k * 3.3) * 0.25, press: v => 1.1 - v * 0.6 });
        }
      }
      // superficie/espuma de leche para milk teas
      if (d.k === 'milk' || d.k === 'brown' || d.k === 'smooth') {
        ctx.fillStyle = KT.rgba('#FFFFFF', d.k === 'smooth' ? 0.18 : 0.25);
        ctx.beginPath(); ctx.ellipse(cx, lvlY + H * 0.01, wall(lvlU) - H * 0.02, G.ry * 0.5, 0, 0, TAU); ctx.fill();
      }
      // hielo
      if (o.ice) {
        for (let k = 0; k < 5; k++) {
          const u = KT.hash(k * 7 + 1), s = H * (0.11 + 0.03 * KT.hash(k * 5));
          const x = cx - G.tw * 0.3 + u * G.tw * 0.6, y = lvlY + H * 0.06 + KT.hash(k * 11) * H * 0.14 + Math.sin((o.wave || 0) + k) * H * 0.006;
          if (y > by - H * 0.1) continue;
          ctx.save(); ctx.translate(x, y); ctx.rotate((KT.hash(k * 3) - 0.5) * 0.9);
          ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.beginPath(); KT.rr(ctx, -s / 2, -s / 2, s, s, s * 0.18); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = H * 0.004; ctx.stroke(); ctx.restore();
        }
      }
      ctx.restore();
    }

    // toppings en el fondo (caen con drop)
    const tp = o.top || d.top || { type: 'tapioca' };
    if (tp && tp.type && drop > 0) {
      ctx.save(); cupPath(H * 0.014); ctx.clip();
      const R = KT.rng(o.seed || 5), count = tp.count || (tp.type === 'jelly' ? 9 : 16), r = H * (tp.type === 'tapioca' ? 0.042 : 0.038);
      for (let k = 0; k < count; k++) {
        const row = Math.floor(k / 6), col = k % 6, u = (col + (row % 2) * 0.5) / 5.5 - 0.5;
        const yy = by - r * 1.15 - row * r * 1.55 - R() * r * 0.3, xx = cx + u * (G.bw - r * 2.2) + (R() - 0.5) * r * 0.4;
        const dk = KT.E.outCubic(KT.clamp((drop - k * 0.025) / 0.45));
        if (dk <= 0) continue;
        const y = (top - r * 2) + (yy - (top - r * 2)) * dk;
        if (tp.type === 'tapioca') KT.pearl(ctx, xx, y, r, { color: tp.color || KT.C.pearl });
        else if (tp.type === 'pop') KT.popPearl(ctx, xx, y, r, tp.color || '#F4DCD6');
        else KT.jelly(ctx, xx, y, r * 1.7, tp.color || '#F2ECE2', (R() - 0.5) * 0.8);
      }
      ctx.restore();
    }

    // pared delantera: brillo, condensación y contorno
    ctx.save(); cupPath(0); ctx.clip();
    const hl = ctx.createLinearGradient(cx - G.tw / 2, 0, cx + G.tw / 2, 0);
    hl.addColorStop(0, 'rgba(255,255,255,0.0)'); hl.addColorStop(0.1, 'rgba(255,255,255,0.55)'); hl.addColorStop(0.2, 'rgba(255,255,255,0.08)');
    hl.addColorStop(0.78, 'rgba(255,255,255,0.0)'); hl.addColorStop(0.88, 'rgba(255,255,255,0.22)'); hl.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = hl; ctx.fillRect(cx - G.tw / 2, top, G.tw, G.h);
    if (o.sweat) {
      const R = KT.rng(31);
      for (let k = 0; k < 60 * o.sweat; k++) { const u = R(), v = R(); const x = cx + (u - 0.5) * 2 * wall(v) * 0.92, y = by - v * G.h; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, H * 0.004, H * 0.006, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    cupPath(0);
    ctx.strokeStyle = style === 'line' ? line : 'rgba(255,255,255,0.75)'; ctx.lineWidth = style === 'line' ? lw : H * 0.004; ctx.stroke();
    if (style !== 'line') { ctx.strokeStyle = 'rgba(60,40,30,0.18)'; ctx.lineWidth = H * 0.003; ctx.stroke(); }

    // tapa sellada (película impresa)
    if (o.film !== false) {
      ctx.save(); ctx.translate(cx, top + G.ry * 0.2);
      ctx.fillStyle = o.filmColor || '#FBF8F3'; ctx.beginPath(); ctx.ellipse(0, 0, G.tw / 2 + H * 0.012, G.ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = style === 'line' ? line : 'rgba(80,60,45,0.35)'; ctx.lineWidth = style === 'line' ? lw : H * 0.004; ctx.stroke();
      // ilustración en tinta sobre la película: olas y un koi
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, G.tw / 2 - H * 0.01, G.ry * 0.8, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = 'rgba(42,37,35,0.55)'; ctx.lineWidth = H * 0.004; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); const yy = -G.ry * 0.1 + k * G.ry * 0.32; ctx.moveTo(-G.tw * 0.36, yy); ctx.bezierCurveTo(-G.tw * 0.12, yy - G.ry * 0.5, G.tw * 0.1, yy + G.ry * 0.5, G.tw * 0.36, yy - G.ry * 0.1); ctx.stroke(); }
      ctx.fillStyle = KT.rgba(KT.C.koi, 0.8); ctx.beginPath(); ctx.ellipse(G.tw * 0.16, -G.ry * 0.25, G.tw * 0.05, G.ry * 0.18, 0, 0, TAU); ctx.fill();
      ctx.restore(); ctx.restore();
    }
    // popote ancho
    if (o.straw) {
      const sx = cx + G.tw * 0.12, sy = top + G.ry * 0.2, ang = o.strawAng == null ? 0.22 : o.strawAng, L = H * 0.42, w = H * 0.07;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
      ctx.fillStyle = typeof o.straw === 'string' ? o.straw : KT.C.koiDeep;
      ctx.beginPath(); KT.rr(ctx, -w / 2, -L, w, L + H * 0.02, w * 0.18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w * 0.32, -L + H * 0.01, w * 0.14, L);
      if (style === 'line') { ctx.strokeStyle = line; ctx.lineWidth = lw * 0.8; ctx.beginPath(); KT.rr(ctx, -w / 2, -L, w, L + H * 0.02, w * 0.18); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
    return { top, tw: G.tw, bw: G.bw, ry: G.ry };
  };
  KT.cupGeo = geo;
})();
