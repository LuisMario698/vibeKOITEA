/* Versión 2 · Tinta — solo pantalla central.
   Sumi-e sobre papel washi: un enso, un koi de tinta, la caligrafía 鯉 y el sello; luego la bebida se pinta como obra
   y se presenta con su ficha de museo; cierra con la frase de la marca y el QR. Loop de 40 s, 3 obras (vueltas). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 40, seg = KT.seg;
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

  // ficha de museo: plana, sin sombra ni esquinas redondas, centrada bajo el vaso
  const PL = { name: { size: 74, family: F.serif }, min: 62, top: 40, es: 68, en: 56, rule: 38, price: 108, bottom: 44 };
  function placardLayout(ctx, art, w) {
    const T = KT.fitLines(ctx, art.name, PL.name, w - 104, PL.min), s = T.o.size;
    const y1 = PL.top + s * 0.8, yl = y1 + (T.lines.length - 1) * s * 1.04, yes = yl + PL.es, yen = yes + PL.en, yr = yen + PL.rule, yp = yr + PL.price;
    return { T, y1, yes, yen, yr, yp, h: yp + PL.bottom };
  }
  function placard(ctx, x, y, w, a, art, d, t0, t, out) {
    if (a <= 0) return;
    const Lo = placardLayout(ctx, art, w), h = Lo.h;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#FFFCF5'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = KT.rgba(INK, 0.22); ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();
    const X = x + 52, lt = t - t0, inner = w - 104, s = Lo.T.o.size;
    Lo.T.lines.forEach((ln, i) => KT.textIn(ctx, ln, X, y + Lo.y1 + i * s * 1.04, Object.assign({ color: INK, mode: 'mask', stagger: 0.025 }, Lo.T.o), lt - 0.2 - i * 0.2, out));
    KT.textIn(ctx, art.es, X, y + Lo.yes, { size: 50, weight: 500, family: F.sans, color: INK, mode: 'fade', stagger: 0.01 }, lt - 0.7, out);
    KT.textIn(ctx, art.en, X, y + Lo.yen, { size: 46, weight: 400, family: F.sans, color: C.en, mode: 'fade', stagger: 0.01 }, lt - 1.0, out);
    const ra = KT.clamp((lt - 1.1) / 0.5) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
    if (ra > 0) { ctx.fillStyle = KT.rgba(INK, 0.2 * ra); ctx.fillRect(X, y + Lo.yr, inner, 2); }
    const pv = String(d.p), pO = { size: 100, weight: 600, family: F.sans, color: INK, stagger: 0.04 };
    const pw = KT.measure(ctx, pv, pO);
    KT.textIn(ctx, pv, X, y + Lo.yp, pO, lt - 1.3, out);
    KT.textIn(ctx, 'MXN', X + pw + 16, y + Lo.yp, { size: 42, weight: 600, family: F.sans, color: INK, ls: 3, mode: 'fade' }, lt - 1.5, out);
    KT.textIn(ctx, '≈ ' + KT.money(d.p, 'usd'), x + w - 52, y + Lo.yp, { size: 46, weight: 500, family: F.sans, color: C.en, align: 'right', mode: 'fade' }, lt - 1.7, out);
  }

  KT.register({
    id: 'v2', n: 2, name: 'Tinta', format: 'central', duration: L, cycles: 3, cycleLabel: 'Obra',
    tagline: 'Sumi-e sobre papel: la bebida se pinta y se presenta como obra de galería.',
    chapters: [
      { t: 0, label: 'Enso', note: 'Un pincel traza el círculo y un koi de tinta nada dentro. 鯉 se escribe trazo por trazo y el sello 茶 lo firma: juntos dicen «Koi Tea».' },
      { t: 12, label: 'La obra del día', note: 'La bebida se pinta con pincel y acuarela, el sello la firma y una ficha de museo da nombre y precio.' },
      { t: 24.4, label: 'Sabor y arte', note: 'La frase de la marca, sola, con el koi nadando debajo.' },
      { t: 32, label: 'Síguenos', note: 'Un enso enmarca el QR a Instagram, con una razón para seguir.' }
    ],
    info: {
      concept: 'Una pieza de galería en movimiento. Sobre papel washi, un pincel traza un enso y un koi de tinta nada dentro; al lado, 鯉 se escribe trazo por trazo y un sello rojo 茶 firma la obra (juntos: «Koi Tea»). Después la bebida del día se pinta a mano y se presenta con una ficha como las de un museo: nombre, descripción en español e inglés y precio. Cierra con la frase de la marca y con el QR dentro de un enso.',
      why: 'Koi Tea se presenta como un lugar donde el sabor y el arte se juntan, y tiene una galería de fotografía al fondo y cuadros con caligrafía. Esta versión lleva esa idea a la pantalla con la técnica que mejor dialoga con el local: tinta, papel y sello rojo. Es la más calmada de las cinco y la que mejor convive con la luz cálida.',
      signature: 'La caligrafía 鯉 se escribe en el orden real de sus 18 trazos, con presión de pincel, y el sello firma cada obra.',
      specs: [['Formato', 'Pantalla central · 1080 × 1920'], ['Loop', '40 s × 3 obras = 120 s'], ['Escenas', '4 por vuelta, de 8 a 12 s'], ['Texto', 'Frase 104 px · inglés ≥ 46 px'], ['Laterales', 'Como hoy o en crema'], ['Exportación', 'MP4 de 120 s o web']]
    },
    setup() { return { paper: KT.paper(1080, 1920, '#F7F0E4', 23, 1.35) }; },
    draw(ctx, t, view, st) {
      const ci = view.cycle || 0, art = ART[ci], d = KT.drink(art.name);
      ctx.drawImage(st.paper, 0, 0, 1080, 1920);
      // transición propia: una aguada de tinta muy diluida se abre desde el centro y se lava en cada cambio de escena
      [12, 24.4, 32].forEach(T => {
        const p = E.outCubic(seg(t, T - 1.0, T + 0.2)), a = 0.075 * Math.min(1, seg(t, T - 1.0, T - 0.6) * 2) * (1 - seg(t, T + 0.1, T + 1.3));
        if (p <= 0 || a <= 0) return;
        const r = 260 + 1100 * p, g = ctx.createRadialGradient(540, 980, r * 0.15, 540, 980, r);
        g.addColorStop(0, KT.rgba(INK, a)); g.addColorStop(0.7, KT.rgba(INK, a * 0.75)); g.addColorStop(1, KT.rgba(INK, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
      });

      // koi de tinta: nada dentro del enso (escena 1) y bajo la frase (escena 3)
      const koiA = Math.max(KT.env(t, 1.6, 11.2, 1.2, 0.8), KT.env(t, 25, 31.8, 1.4, 1.0) * 0.9);
      if (koiA > 0) {
        const inEnso = t < 18;
        const path = inEnso ? KT.koi.paths.orbit(520, 720, 168, 120, L, 3, 0.4, 1) : KT.koi.paths.orbit(540, 1430, 300, 110, L, 2, 2.2, -1);
        const P = KT.koi.spine(path, t, { len: inEnso ? 270 : 300 });
        KT.koi.draw(ctx, P, { R: inEnso ? 34 : 36, style: 'ink', phase: (TAU * 32 * t) / L, seed: 'mascot', alpha: koiA, lw: 5 });
      }

      // ---- escena 1 (0–12 s): enso, 鯉 trazo por trazo, sello 茶 y presentación ----
      if (t < 12.2) {
        const outA = 1 - seg(t, 11, 12);
        ctx.save(); ctx.globalAlpha = outA;
        KT.enso(ctx, 520, 720, 300, E.ink(seg(t, 0.5, 2.4)), { w: 54, seed: 5, start: -2.0, color: INK, paper: '#F7F0E4', gaps: 0.9 });
        // salpicaduras donde el pincel se levanta
        KT.inkBloom(ctx, 302, 514, 18, seg(t, 2.3, 2.9), { seed: 3, alpha: 0.5, color: INK });
        KT.inkBloom(ctx, 326, 486, 9, seg(t, 2.4, 3.0), { seed: 8, alpha: 0.5, color: INK });
        KT.calli(ctx, '鯉', 925, 430, 210, t - 2.6, { color: INK, speed: 1.25, weight: 0.1, seed: 11 });
        ctx.restore();
        const sealT = 2.6 + KT.calliDur('鯉', 1.25) + 0.25, stamp = seg(t, sealT, sealT + 0.4);
        if (stamp > 0) KT.hanko(ctx, 932, 610, 96, '茶', { alpha: outA * KT.clamp(stamp * 2), scale: 1 + (1 - E.outCubic(stamp)) * 0.6, rot: 0.04 });
        const out = t > 11 ? t - 11 : null;
        KT.textIn(ctx, 'KOI TEA', 110, 1340, { size: 120, weight: 600, family: F.logo, color: INK, ls: 24, mode: 'mask', stagger: 0.06, dur: 1.1 }, t - 5.6, out);
        KT.textIn(ctx, 'Boba shop · Puerto Peñasco', 114, 1420, { size: 52, weight: 500, family: F.sans, color: C.en, mode: 'fade', stagger: 0.015 }, t - 6.2, out);
        const ra = seg(t, 6.6, 7.2) * outA;
        if (ra > 0) { ctx.fillStyle = KT.rgba(INK, 0.2 * ra); ctx.fillRect(114, 1484, 160, 3); }
        const imp = KT.fit(ctx, 'Ingredientes importados de Taiwán', { size: 58, weight: 500, family: F.sans }, 860, 50);
        KT.textIn(ctx, 'Ingredientes importados de Taiwán', 114, 1580, Object.assign({ color: INK, mode: 'fade', stagger: 0.01 }, imp), t - 6.8, out);
        KT.textIn(ctx, 'Ingredients imported from Taiwan', 114, 1646, { size: 50, weight: 400, family: F.sans, color: C.en, mode: 'fade', stagger: 0.01 }, t - 7.1, out);
      }

      // ---- escena 2 (12–24.4 s): la obra del día ----
      if (t > 12 && t < 24.6) {
        const fade = 1 - seg(t, 23.4, 24.4), by = 1210, H = 600;
        ctx.save(); ctx.globalAlpha = fade;
        KT.text(ctx, 'LA OBRA DEL DÍA', 540, 330, { size: 52, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 6, alpha: seg(t, 12.2, 13.0) });
        KT.text(ctx, 'Today’s piece', 540, 392, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', alpha: seg(t, 12.5, 13.3) });
        paintedCup(ctx, 540, by, H, d, seg(t, 12.6, 15.0), seg(t, 14.2, 16.4), seg(t, 15.4, 17.0), ci * 1.7);
        if (art.ice) { for (let k = 0; k < 3; k++) { const a = seg(t, 15.6 + k * 0.2, 16.2 + k * 0.2); if (a <= 0) continue; ctx.strokeStyle = KT.rgba(INK, 0.45 * a); ctx.lineWidth = 4; ctx.save(); ctx.translate(470 + k * 70, by - H + 90 + (k % 2) * 50); ctx.rotate(0.3 * k - 0.2); ctx.strokeRect(-30, -30, 60, 60); ctx.restore(); } }
        ctx.restore();
        // el sello firma la obra, abajo a la derecha del vaso, como en una pintura
        const stamp = seg(t, 17.1, 17.5);
        if (stamp > 0) KT.hanko(ctx, 812, by - 30, 78, '鯉', { alpha: fade * KT.clamp(stamp * 2), scale: 1 + (1 - E.outCubic(stamp)) * 0.5, rot: -0.05 });
        const pw = 660, pa = seg(t, 16.6, 17.4) * fade;
        placard(ctx, 540 - pw / 2, by + 76, pw, pa, art, d, 16.8, t, t > 23.4 ? t - 23.4 : null);
      }

      // ---- escena 3 (24.4–32 s): la frase, sola ----
      if (t > 24.2 && t < 32.2) {
        const out = t > 31.2 ? t - 31.2 : null;
        const Q = { size: 104, style: 'italic', family: F.serif, color: INK, mode: 'mask', stagger: 0.025, dur: 1.1 };
        KT.textIn(ctx, 'El sabor y el arte', 110, 560, Q, t - 24.6, out);
        KT.textIn(ctx, 'se unen en un', 110, 690, Q, t - 25.2, out);
        KT.textIn(ctx, 'mismo espacio', 110, 820, Object.assign({}, Q, { color: C.red }), t - 25.8, out);
        const uw = KT.measure(ctx, 'mismo espacio', Q);
        const ul = KT.cubicPts([108, 858], [108 + uw * 0.3, 868], [108 + uw * 0.65, 842], [118 + uw, 852], 40);
        ctx.save(); ctx.globalAlpha = 1 - seg(t, 31.2, 32);
        KT.brush(ctx, ul, E.ink(seg(t, 26.6, 27.6)), { w: 13, color: C.koiDeep, taperIn: 0.05, taperOut: 0.4, dry: 0.7, seed: 12, alpha: 0.85 });
        ctx.restore();
        KT.textIn(ctx, 'Where flavor meets art', 114, 960, { size: 54, weight: 400, family: F.sans, color: C.en, mode: 'fade', stagger: 0.015 }, t - 27.4, out);
      }

      // ---- escena 4 (32–40 s): Síguenos, con el QR dentro de un enso ----
      if (t > 31.8) {
        const out = t > 39 ? t - 39 : null, fadeA = 1 - seg(t, 39.1, 39.8);
        KT.textIn(ctx, 'Síguenos', 540, 470, { size: 124, style: 'italic', family: F.serif, color: INK, align: 'center', mode: 'mask', stagger: 0.03 }, t - 32.3, out);
        ctx.save(); ctx.globalAlpha = fadeA;
        KT.enso(ctx, 540, 880, 300, E.ink(seg(t, 32.6, 34.2)), { w: 40, seed: 9, start: -1.4, color: INK, paper: '#F7F0E4', gaps: 0.7 });
        ctx.restore();
        const qa = seg(t, 33.4, 34.0) * fadeA;
        if (qa > 0) { ctx.save(); ctx.globalAlpha = qa; KT.qr(ctx, 540 - 170, 880 - 170, 340, { round: 0.3, radius: 22, reveal: E.outCubic(seg(t, 33.4, 34.8)), light: '#FFFDF8', dark: INK }); ctx.restore(); }
        KT.textIn(ctx, '@koitea.mx', 540, 1330, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.025 }, t - 34.4, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1440, { size: 56, weight: 500, family: F.sans, color: INK, align: 'center', mode: 'fade' }, t - 35.0, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1510, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 35.3, out);
      }
    }
  });
})();
