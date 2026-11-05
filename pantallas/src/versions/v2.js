/* Versión 2 · Tinta — solo pantalla central.
   Sumi-e sobre papel washi: un enso, un koi de tinta, la caligrafía 鯉 y el sello; luego la bebida se pinta como obra
   y se presenta con su ficha de galería; cierra con la frase de la marca. Loop de 36 s, 3 obras (vueltas). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 36, seg = KT.seg;
  const ART = [
    { name: 'Taro Milk Tea', es: 'Té negro, leche y taro', en: 'Black tea, milk & taro' },
    { name: 'Durazno Green Tea', es: 'Té verde con durazno', en: 'Peach green tea', ice: true },
    { name: 'Koi Tea', es: 'Té verde y fruta en capas', en: 'Layered green tea & fruit', ice: true }
  ];
  const INK = '#231F1D';

  // vaso pintado a pincel: contorno, aguada de color y toppings en tinta
  function paintedCup(ctx, cx, by, H, d, pLine, pWash, pTop, art) {
    const tw = H * 0.66, bw = H * 0.47, top = by - H;
    const wall = side => KT.cubicPts([cx + side * tw / 2, top + 6], [cx + side * (tw / 2 - H * 0.03), top + H * 0.4], [cx + side * (bw / 2 + H * 0.02), by - H * 0.3], [cx + side * bw / 2, by], 40);
    const bottom = KT.cubicPts([cx - bw / 2, by], [cx - bw / 6, by + H * 0.025], [cx + bw / 6, by + H * 0.025], [cx + bw / 2, by], 24);
    // aguada (acuarela) dentro del vaso
    if (pWash > 0) {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(cx - tw / 2 + 8, top + 10); ctx.lineTo(cx + tw / 2 - 8, top + 10); ctx.lineTo(cx + bw / 2 - 6, by - 4); ctx.lineTo(cx - bw / 2 + 6, by - 4); ctx.closePath(); ctx.clip();
      const lvl = by - (H - 40) * E.inOutCubic(pWash);
      const gr = ctx.createLinearGradient(0, by, 0, top);
      d.layers.forEach(([pos, c]) => gr.addColorStop(pos, KT.rgba(c, 0.62)));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(cx - tw, by + 10);
      for (let k = 0; k <= 24; k++) { const x = cx - tw / 2 + (tw * k) / 24; ctx.lineTo(x, lvl + Math.sin(k * 1.9 + art) * 7 + Math.sin(k * 0.7) * 5); }
      ctx.lineTo(cx + tw, by + 10); ctx.closePath(); ctx.fill();
      // floraciones más oscuras de acuarela
      for (let k = 0; k < 6; k++) {
        const x = cx + (KT.hash(k * 3 + art) - 0.5) * bw * 0.9, y = by - H * (0.15 + KT.hash(k * 7 + art) * 0.6);
        if (y < lvl) continue;
        ctx.fillStyle = KT.rgba(d.c1, 0.16); ctx.beginPath(); ctx.ellipse(x, y, 40 + KT.hash(k) * 50, 30 + KT.hash(k + 9) * 40, k, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    // contorno con pincel
    if (pLine > 0) {
      const pl = E.ink(pLine);
      KT.brush(ctx, wall(-1), KT.seg(pl, 0, 0.45), { w: 13, color: INK, taperIn: 0.08, taperOut: 0.25, dry: 0.5, seed: 4 });
      KT.brush(ctx, bottom, KT.seg(pl, 0.4, 0.6), { w: 10, color: INK, taperIn: 0.2, taperOut: 0.3 });
      KT.brush(ctx, wall(1), KT.seg(pl, 0.15, 0.6), { w: 12, color: INK, taperIn: 0.08, taperOut: 0.25, dry: 0.4, seed: 9 });
      const lid = []; for (let k = 0; k <= 40; k++) { const a = Math.PI + (k / 40) * TAU; lid.push({ x: cx + Math.cos(a) * (tw / 2 + 6), y: top + 6 + Math.sin(a) * tw * 0.07 }); }
      KT.brush(ctx, lid, KT.seg(pl, 0.55, 1), { w: 9, color: INK, taperIn: 0.05, taperOut: 0.12, dry: 0.3, seed: 2 });
    }
    // toppings: puntos de tinta o cubos translúcidos
    if (pTop > 0) {
      const tp = d.top || { type: 'tapioca' };
      for (let k = 0; k < 14; k++) {
        const a = E.outBack(KT.clamp((pTop - k * 0.04) / 0.4)); if (a <= 0) continue;
        const row = Math.floor(k / 5), col = k % 5, x = cx - bw * 0.36 + col * bw * 0.18 + (row % 2) * bw * 0.09, y = by - 26 - row * 40;
        if (tp.type === 'tapioca') { ctx.fillStyle = KT.rgba(INK, 0.88); ctx.beginPath(); ctx.ellipse(x, y, 17 * a, 15 * a, k, 0, TAU); ctx.fill(); }
        else if (tp.type === 'jelly') { ctx.strokeStyle = KT.rgba(INK, 0.6); ctx.lineWidth = 4; ctx.fillStyle = KT.rgba('#FFFFFF', 0.5); ctx.beginPath(); KT.rr(ctx, x - 16 * a, y - 16 * a, 32 * a, 32 * a, 7); ctx.fill(); ctx.stroke(); }
        else { ctx.fillStyle = KT.rgba(tp.color || C.koi, 0.85); ctx.beginPath(); ctx.arc(x, y, 15 * a, 0, TAU); ctx.fill(); }
      }
    }
  }

  function placard(ctx, x, y, w, h, a, art, d, t0, t, out) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - E.outCubic(a)) * 40);
    ctx.fillStyle = 'rgba(80,55,35,0.10)'; ctx.beginPath(); KT.rr(ctx, x + 10, y + 14, w, h, 10); ctx.fill();
    ctx.fillStyle = '#FFFDF8'; ctx.beginPath(); KT.rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = KT.rgba(INK, 0.16); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = KT.rgba(INK, 0.14); ctx.fillRect(x + 56, y + h - 170, w - 112, 2);
    ctx.restore();
    const X = x + 56, R = x + w - 56, lt = t - t0;
    const nameO = KT.fit(ctx, art.name, { size: 80, weight: 600, family: F.sans }, w - 112, 60);
    KT.textIn(ctx, art.name, X, y + 124, Object.assign({ color: INK, mode: 'mask', stagger: 0.025 }, nameO), lt - 0.2, out);
    KT.textIn(ctx, art.es, X, y + 222, { size: 56, weight: 500, family: F.sans, color: INK, mode: 'fade', stagger: 0.01 }, lt - 0.7, out);
    KT.textIn(ctx, art.en, X, y + 290, { size: 48, weight: 400, family: F.sans, color: C.en, mode: 'fade', stagger: 0.01 }, lt - 1.0, out);
    const mxnW = KT.measure(ctx, 'MXN', { size: 44, weight: 600, family: F.sans, ls: 3 });
    KT.textIn(ctx, 'MXN', R, y + h - 58, { size: 44, weight: 600, family: F.sans, color: INK, align: 'right', ls: 3, mode: 'fade' }, lt - 1.5, out);
    KT.textIn(ctx, String(d.p), R - mxnW - 18, y + h - 52, { size: 112, weight: 600, family: F.sans, color: INK, align: 'right', stagger: 0.04 }, lt - 1.3, out);
    KT.textIn(ctx, '≈ ' + KT.money(d.p, 'usd'), X + 100, y + h - 62, { size: 46, weight: 500, family: F.sans, color: C.en, mode: 'fade' }, lt - 1.7, out);
    const sa = KT.clamp((lt - 1.8) / 0.4) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
    if (sa > 0) KT.hanko(ctx, X + 34, y + h - 78, 66, '鯉', { alpha: sa, scale: 1 + (1 - E.outCubic(KT.clamp((lt - 1.8) / 0.4))) * 0.5, rot: -0.06 });
  }

  KT.register({
    id: 'v2', n: 2, name: 'Tinta', format: 'central', duration: L, cycles: 3, cycleLabel: 'Obra',
    tagline: 'Sumi-e sobre papel: la bebida se pinta y se presenta como obra de galería.',
    chapters: [
      { t: 0, label: 'Enso', note: 'Un pincel traza el círculo; un koi de tinta nada dentro. Caligrafía 鯉 y sello.' },
      { t: 9.4, label: 'La obra del día', note: 'La bebida se pinta con pincel y acuarela, con su ficha de galería y precio.' },
      { t: 24, label: 'Sabor y arte', note: 'La frase de la marca y el QR a Instagram con una razón para seguir.' }
    ],
    info: {
      concept: 'Una pieza de galería en movimiento. Sobre papel washi, un pincel traza un enso y un koi de tinta nada dentro. Después la bebida del día se pinta a mano y se presenta con una ficha como las de un museo: nombre, descripción en español e inglés y precio. Cierra con la frase de la marca: “el sabor y el arte se unen en un mismo espacio”.',
      why: 'Koi Tea se presenta como un lugar donde el sabor y el arte se juntan, y tiene una galería de fotografía al fondo y cuadros con caligrafía. Esta versión lleva esa idea a la pantalla con la técnica que mejor dialoga con el local: tinta, papel y sello rojo. Es la más calmada de las cinco y la que mejor convive con la luz cálida.',
      signature: 'El sello rojo 鯉 se estampa sobre la ficha de la obra, como firma del artista.',
      specs: [['Formato', 'Pantalla central · 1080 × 1920'], ['Loop', '36 s × 3 obras = 108 s'], ['Escenas', '3 por vuelta, de 9 a 14 s'], ['Texto', 'Frase 124 px · inglés ≥ 46 px'], ['Laterales', 'Sin cambio'], ['Exportación', 'MP4 de 108 s o web']]
    },
    setup() { return { paper: KT.paper(1080, 1920, '#F7F0E4', 23, 1.35) }; },
    draw(ctx, t, view, st) {
      const ci = view.cycle || 0, art = ART[ci], d = KT.drink(art.name);
      ctx.drawImage(st.paper, 0, 0, 1080, 1920);

      // koi de tinta: nada siempre (3 vueltas por loop); visible según la escena
      const koiA = Math.max(KT.env(t, 1.6, 9.2, 1.2, 0.8), KT.env(t, 26, 35.4, 1.4, 1.0) * 0.9);
      if (koiA > 0) {
        const inEnso = t < 16;
        const path = inEnso ? KT.koi.paths.orbit(520, 720, 168, 120, L, 3, 0.4, 1) : KT.koi.paths.orbit(540, 1010, 400, 34, L, 2, 2.2, -1);
        const P = KT.koi.spine(path, t, { len: inEnso ? 270 : 300 });
        KT.koi.draw(ctx, P, { R: inEnso ? 34 : 36, style: 'ink', phase: (TAU * 30 * t) / L, seed: 'mascot', alpha: koiA, lw: 5 });
      }

      // ---- escena 1: enso, caligrafía y sello ----
      const outA = 1 - seg(t, 8.4, 9.4);
      if (t < 9.6) {
        ctx.save(); ctx.globalAlpha = outA;
        KT.enso(ctx, 520, 720, 300, seg(t, 0.5, 3.2), { w: 54, seed: 5, start: -2.0, color: INK, paper: '#F7F0E4', gaps: 0.9 });
        // gotas de tinta al terminar el trazo
        KT.inkBloom(ctx, 760, 520, 26, seg(t, 3.1, 3.8), { seed: 3, alpha: 0.5, color: INK });
        KT.inkBloom(ctx, 790, 488, 12, seg(t, 3.2, 3.9), { seed: 8, alpha: 0.5, color: INK });
        // caligrafía 鯉 revelada de arriba abajo
        const cp = E.ink(seg(t, 2.8, 4.6));
        if (cp > 0) {
          ctx.save(); ctx.beginPath(); ctx.rect(760, 230, 300, 300 * cp + 10); ctx.clip();
          KT.text(ctx, '鯉', 905, 480, { size: 250, weight: 400, family: F.brush, color: INK, align: 'center' });
          ctx.restore();
        }
        ctx.restore();
        const stamp = seg(t, 4.6, 5.0);
        if (stamp > 0) KT.hanko(ctx, 905, 640, 104, '鯉', { alpha: outA * KT.clamp(stamp * 2), scale: 1 + (1 - E.outCubic(stamp)) * 0.6, rot: 0.05 });
        const out = t > 8.4 ? t - 8.4 : null;
        KT.textIn(ctx, 'Koi Tea', 110, 1360, { size: 170, weight: 600, style: 'italic', family: F.serif, color: INK, mode: 'mask', stagger: 0.05, dur: 1.2 }, t - 4.4, out);
        KT.textIn(ctx, 'Boba shop · Puerto Peñasco', 116, 1448, { size: 52, weight: 500, family: F.sans, color: C.en, mode: 'fade', stagger: 0.015 }, t - 5.0, out);
        const imp = KT.fit(ctx, 'Ingredientes importados de Taiwán', { size: 58, weight: 500, family: F.sans }, 880, 50);
        KT.textIn(ctx, 'Ingredientes importados de Taiwán', 116, 1560, Object.assign({ color: INK, mode: 'fade', stagger: 0.01 }, imp), t - 5.6, out);
        KT.textIn(ctx, 'Ingredients imported from Taiwan', 116, 1626, { size: 50, weight: 400, family: F.sans, color: C.en, mode: 'fade', stagger: 0.01 }, t - 5.9, out);
      }

      // ---- escena 2: la obra del día ----
      if (t > 9.4 && t < 24.2) {
        const fade = 1 - seg(t, 22.8, 23.9);
        ctx.save(); ctx.globalAlpha = fade;
        KT.text(ctx, 'LA OBRA DEL DÍA', 540, 300, { size: 52, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 6, alpha: seg(t, 9.6, 10.4) });
        KT.text(ctx, 'Today’s piece', 540, 362, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', alpha: seg(t, 9.9, 10.7) });
        paintedCup(ctx, 540, 1190, 620, d, seg(t, 9.8, 12.4), seg(t, 11.6, 13.8), seg(t, 12.8, 14.4), ci * 1.7);
        if (art.ice) { for (let k = 0; k < 3; k++) { const a = seg(t, 13 + k * 0.2, 13.6 + k * 0.2); if (a <= 0) continue; ctx.strokeStyle = KT.rgba(INK, 0.45 * a); ctx.lineWidth = 4; ctx.save(); ctx.translate(470 + k * 70, 650 + (k % 2) * 50); ctx.rotate(0.3 * k - 0.2); ctx.strokeRect(-30, -30, 60, 60); ctx.restore(); } }
        ctx.restore();
        placard(ctx, 110, 1268, 860, 540, seg(t, 13.8, 14.8) * fade, art, d, 14.0, t, t > 22.8 ? t - 22.8 : null);
      }

      // ---- escena 3: sabor y arte ----
      if (t > 23.8) {
        const out = t > 34.4 ? t - 34.4 : null;
        const Q = { size: 124, weight: 600, style: 'italic', family: F.serif, color: INK, mode: 'mask', stagger: 0.025, dur: 1.1 };
        KT.textIn(ctx, 'El sabor y el arte', 104, 470, Q, t - 24.3, out);
        KT.textIn(ctx, 'se unen en un', 104, 610, Q, t - 24.9, out);
        KT.textIn(ctx, 'mismo espacio', 104, 750, Object.assign({}, Q, { color: C.red }), t - 25.5, out);
        KT.textIn(ctx, 'Where flavor meets art', 110, 860, { size: 54, weight: 400, family: F.sans, color: C.en, mode: 'fade', stagger: 0.015 }, t - 26.4, out);
        const ul = KT.cubicPts([110, 796], [300, 806], [520, 776], [790, 788], 40);
        ctx.save(); ctx.globalAlpha = 1 - seg(t, 34.4, 35.2);
        KT.brush(ctx, ul, seg(t, 26.2, 27.2), { w: 13, color: C.koiDeep, taperIn: 0.05, taperOut: 0.5, dry: 0.7, seed: 12, alpha: 0.85 });
        ctx.restore();
        KT.textIn(ctx, 'Síguenos', 540, 1196, { size: 124, weight: 600, style: 'italic', family: F.serif, color: INK, align: 'center', mode: 'mask', stagger: 0.03 }, t - 27.4, out);
        const qa = seg(t, 27.8, 28.4) * (1 - seg(t, 34.6, 35.3));
        if (qa > 0) { ctx.save(); ctx.globalAlpha = qa; KT.qr(ctx, 540 - 150, 1250, 300, { round: 0.3, radius: 22, reveal: E.outCubic(seg(t, 27.8, 29.2)), light: '#FFFDF8', dark: INK }); ctx.restore(); }
        KT.textIn(ctx, '@koitea.mx', 540, 1666, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.025 }, t - 28.6, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1752, { size: 56, weight: 500, family: F.sans, color: INK, align: 'center', mode: 'fade' }, t - 29.2, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1816, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 29.5, out);
      }
      // sello fijo de esquina, con deriva mínima (evita marcas permanentes)
      KT.hanko(ctx, 1002 + Math.sin((TAU * t) / L) * 3, 1846, 62, '茶', { alpha: 0.85, rot: -0.04 });
    }
  });
})();
