/* Versión 4 · Luz — las tres pantallas.
   La tira LED del plafón continúa en las tres pantallas como una sola línea de luz cálida, recta y a la altura
   del plafón real. La central sigue los cuatro cubos de luz del local (torii, vaso, koi, hoja) como capítulos;
   cuando un capítulo habla de una bebida, un pulso de luz viaja por la línea hasta el menú lateral y la ilumina.
   Loop de 60 s × 3 vueltas; en la tercera, el "acorde de té": las bebidas se vierten desde la línea de luz en las
   tres pantallas y drenan hacia un vaso de Koi Tea en la central (7 s). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 60, seg = KT.seg, CX = KT.X0.C, RX = KT.X0.R, WW = KT.WORLD3;
  const LED = '#FFD89A', LEDC = '#FFF3DC', SOFFIT = '#E4BF88', SOFFIT2 = '#D9AE72';
  const LINE_Y = 220;                                   // la línea de luz, recta en las tres pantallas
  // bebida del momento por vuelta (la tercera vive en el menú derecho) y su texto
  const FEAT = [
    { name: 'Taro Milk Tea', title: 'Taro Milk Tea', es: 'Cremoso, con taro', en: 'Creamy taro', side: 'L' },
    { name: 'Brown Sugar Milk Tea', title: 'Brown Sugar Milk Tea', es: 'Azúcar morena y tapioca', en: 'Brown sugar & tapioca', side: 'L' },
    { name: 'Mango', title: 'Mango Smoothie', es: 'Para el calor de Peñasco', en: 'Beat the Rocky Point heat', side: 'R' }
  ];
  const FRUIT = ['Maracuyá Green Tea', 'Fresa Green Tea', 'Durazno Green Tea'];
  const SCENES = [[0, 11], [11, 24], [24, 37], [37, 49], [49, 60]];
  // pulsos de luz: [inicio, x desde, x hasta, duración]; el de la escena 2 va al lado de la bebida de la vuelta
  const pulsesFor = cyc => [[0.2, -150, WW + 150, 14], [11.2, CX + 540, FEAT[cyc].side === 'R' ? RX + 540 : 540, 6.6], [24.2, CX + 540, 540, 6.6], [37.2, CX + 540, 540, 6.6], [49.4, CX + 540, -150, 8], [49.4, CX + 540, WW + 150, 8]];

  function wall(ctx, x0) {
    const g = ctx.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, '#FCF2E3'); g.addColorStop(0.35, '#F8EBD8'); g.addColorStop(1, '#F0E0C9');
    ctx.fillStyle = g; ctx.fillRect(x0, 0, 1080, 1920);
  }
  function soffit(ctx, x0, pulses) {
    const g = ctx.createLinearGradient(0, 0, 0, LINE_Y); g.addColorStop(0, SOFFIT2); g.addColorStop(1, SOFFIT);
    ctx.fillStyle = g; ctx.fillRect(x0, 0, 1080, LINE_Y);
    // resplandor LED bajo el borde (bandas anchas y suaves)
    ctx.save();
    [[120, 0.06], [70, 0.09], [36, 0.14], [16, 0.32]].forEach(([w, a]) => { ctx.fillStyle = KT.rgba(LED, a); ctx.fillRect(x0, LINE_Y - w / 2, 1080, w); });
    ctx.fillStyle = LEDC; ctx.fillRect(x0, LINE_Y - 2.5, 1080, 5);
    pulses.forEach(([x, k]) => {
      if (x < x0 - 400 || x > x0 + 1480) return;
      const r = 260 * k;
      ctx.globalAlpha = 0.85 * k; ctx.drawImage(KT.glow('#FFE2A8', 260), x - r, LINE_Y - r, r * 2, r * 2);
      ctx.globalAlpha = 1; ctx.fillStyle = KT.rgba('#FFFFFF', 0.9 * k); ctx.beginPath(); ctx.ellipse(x, LINE_Y, 60 * k, 7, 0, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function activePulses(t, cyc) {
    const out = [];
    pulsesFor(cyc).forEach(([s, a, b, d]) => { const p = (t - s) / d; if (p > 0 && p < 1) out.push([KT.lerp(a, b, E.inOutSine(p)), Math.sin(Math.PI * p)]); });
    return out;
  }
  // marco tipo passe-partout con filete nogal (pantallas laterales)
  function frame(ctx) {
    ctx.strokeStyle = KT.rgba(C.walnut, 0.75); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.rect(40, 290, 1000, 1600); ctx.stroke();
    ctx.strokeStyle = KT.rgba(C.walnut, 0.22); ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(54, 304, 972, 1572); ctx.stroke();
  }
  // los cuatro cubos de luz de la columna del local: cara crema, canto negro como cara lateral, ícono en silueta
  const ICONS = ['torii', 'boba', 'koi', 'leaf'];
  function cubes(ctx, t) {
    const sceneIdx = SCENES.findIndex(([a, b]) => t >= a && t < b);
    const size = 150, gap = 44, total = size * 4 + gap * 3, sx = 540 - total / 2, y = 1690;
    for (let i = 0; i < 4; i++) {
      const on = sceneIdx === 4 ? KT.seg(t, 49.6 + i * 0.25, 50.4 + i * 0.25) * (1 - KT.seg(t, 58.6 + i * 0.15, 59.5 + i * 0.15)) : (sceneIdx === i ? Math.min(KT.seg(t, SCENES[i][0] + 0.6, SCENES[i][0] + 1.6), 1 - KT.seg(t, SCENES[i][1] - 0.6, SCENES[i][1])) : 0);
      const x = sx + i * (size + gap);
      if (on > 0) { ctx.globalAlpha = on * 0.9; ctx.drawImage(KT.glow('#FFE0A6', 150), x + size / 2 - 150, y + size / 2 - 150, 300, 300); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#2A2523'; ctx.beginPath(); KT.rr(ctx, x + 10, y + 10, size, size, 4); ctx.fill();
      ctx.fillStyle = KT.mix('#EADBC4', '#FDF0D5', on); ctx.beginPath(); KT.rr(ctx, x, y, size, size, 4); ctx.fill();
      ctx.strokeStyle = KT.rgba(C.ink, 0.4 + on * 0.6); KT.icon[ICONS[i]](ctx, x + size / 2, y + size / 2 + 2, 96, 5);
    }
  }
  // vertido de una bebida desde la línea de luz: chorro con orillas que ondulan, cabeza que se desvanece al caer
  // y cola redondeada al drenar (nada de rectángulos duros)
  function pour(ctx, x, w, d, pFall, pDrain, t, ph) {
    const top = LINE_Y + 4 + (1920 + 80 - LINE_Y) * E.inOutCubic(pDrain), bottom = LINE_Y + 4 + (1920 + 260 - LINE_Y) * E.outCubic(pFall);
    if (bottom - top < 4) return;
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, KT.rgba(d.c2 || d.c1, 0.95)); g.addColorStop(0.72, KT.rgba(d.c1, 0.93)); g.addColorStop(1, KT.rgba(d.c1, 0));
    const N = 28, side = (k, dir) => { const y = top + ((bottom - top) * k) / N; return [x + (dir < 0 ? 0 : w) + Math.sin(y / 85 + t * 2.2 + ph + (dir < 0 ? 0 : 1.7)) * 5 * dir, y]; };
    ctx.fillStyle = g; ctx.beginPath();
    const tail = pDrain > 0 ? Math.min(46, (bottom - top) * 0.3) : 0;
    ctx.moveTo(x, top + tail); ctx.quadraticCurveTo(x + w / 2, top - tail * 0.6, x + w, top + tail);
    for (let k = 0; k <= N; k++) { const [px, py] = side(k, 1); ctx.lineTo(px, Math.max(py, top + tail)); }
    for (let k = N; k >= 0; k--) { const [px, py] = side(k, -1); ctx.lineTo(px, Math.max(py, top + tail)); }
    ctx.closePath(); ctx.fill();
  }

  KT.register({
    id: 'v4', n: 4, name: 'Luz', format: 'triple', duration: L, cycles: 3, cycleLabel: 'Vuelta',
    takeover: { cycle: 2, t: 51.6, label: 'Ver el acorde de té (toma de 7 s)' },
    tagline: 'La línea de luz del plafón cruza las tres pantallas y enciende el menú.',
    chapters: [
      { t: 0, label: 'Bienvenidos', note: 'La tira de luz se enciende de izquierda a derecha. Cubo del torii, la puerta: bienvenida.' },
      { t: 11, label: 'Bebida del momento', note: 'Cubo del vaso. Un pulso de luz viaja hasta el menú (izquierdo o derecho) e ilumina la bebida.' },
      { t: 24, label: 'La casa', note: 'Cubo del koi. La mascota toma su Koi Tea; el menú izquierdo la ilumina.' },
      { t: 37, label: 'Té de Taiwán', note: 'Cubo de la hoja. Tres tés verdes con fruta; el pulso ilumina uno en el menú.' },
      { t: 49, label: 'Etiquétanos', note: 'Los cuatro cubos encendidos, QR a @koitea.mx. En la tercera vuelta, el acorde de té.' }
    ],
    info: {
      concept: 'La tira LED del plafón es lo primero que se ve al entrar, y está justo encima de las pantallas. Aquí esa línea continúa dentro de las tres pantallas como una sola luz cálida, recta y a la altura del plafón. La central sigue los cuatro cubos de luz de la columna del local: torii, vaso, koi y hoja, uno por capítulo. Cuando un capítulo habla de una bebida, un pulso de luz viaja por la línea hasta el menú lateral y la ilumina.',
      why: 'Es la versión más arquitectónica: no agrega un mundo nuevo, sino que extiende el que ya construyeron (plafón, LED, cubos con íconos, madera nogal). Los menús laterales se tratan como cuadros con passe-partout y filete de nogal, en diálogo con la galería del arco. Es sobria, de lectura muy clara y la que mejor se integra con la luz del local.',
      signature: 'El acorde de té: cada tres vueltas, las bebidas del menú se vierten desde la línea de luz en las tres pantallas y drenan hacia un vaso de Koi Tea en la central.',
      specs: [['Formato', '3 pantallas · lienzo de 3720 × 1920'], ['Loop', '60 s × 3 vueltas = 3 min'], ['Menú visible', '≈ 96% del tiempo'], ['Acorde de té', '7 s cada 3 min'], ['Texto del menú', 'Nombres y precios 62 px, fijos'], ['Movimiento', 'Pulsos de luz lentos, sin destellos']]
    },
    setup() { return {}; },
    draw(ctx, t, view) {
      const cyc = view.cycle || 0, x0 = view.x0, feat = FEAT[cyc], fruit = FRUIT[cyc];
      const take = cyc === 2 ? KT.env(t, 52, 59.6, 0.8, 0.9) : 0;
      wall(ctx, x0);
      // ---- laterales ----
      if (view.slot !== 'C') {
        ctx.save(); ctx.translate(x0, 0);
        const ba = 1 - take;
        if (ba > 0) {
          ctx.globalAlpha = ba; frame(ctx);
          let hi = null;
          const k1 = view.slot === feat.side ? KT.env(t, 14.8, 23.6, 0.9, 0.9) : 0;
          const k2 = view.slot === 'L' ? KT.env(t, 27.8, 36.6, 0.9, 0.9) : 0;
          const k3 = view.slot === 'L' ? KT.env(t, 40.8, 48.6, 0.9, 0.9) : 0;
          hi = k1 > 0 ? { name: feat.name, k: k1 } : k2 > 0 ? { name: 'Koi Tea', k: k2 } : k3 > 0 ? { name: fruit, k: k3 } : null;
          KT.board(ctx, view.slot, { top: 318, hi, alpha: ba, scale: Math.min(1, (1868 - 318) / KT.boardHeight(view.slot)) });
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      // ---- central ----
      if (view.slot === 'C') {
        ctx.save(); ctx.translate(x0, 0);
        const sOut = (a, b) => KT.env(t, a, b, 0.8, 0.8) * (1 - take);
        // 1 · Bienvenidos (torii: la puerta)
        const a1 = sOut(0.3, 10.6);
        if (a1 > 0) {
          ctx.save(); ctx.globalAlpha = a1; ctx.strokeStyle = C.ink;
          const tp = E.ink(seg(t, 1.0, 3.6));
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, 380 + 560 * tp); ctx.clip(); KT.icon.torii(ctx, 540, 640, 420, 16); ctx.restore();
          ctx.restore();
          const out = t > 10 ? t - 10 : null;
          KT.textIn(ctx, 'KOI TEA', 540, 1060, { size: 128, weight: 600, family: F.logo, color: C.ink, align: 'center', ls: 20, stagger: 0.06 }, t - 2.6, out);
          KT.textIn(ctx, 'Bienvenidos', 540, 1180, { size: 60, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 3.6, out);
          KT.textIn(ctx, 'Welcome', 540, 1250, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 3.9, out);
          KT.textIn(ctx, 'Boba shop · Puerto Peñasco', 540, 1400, { size: 54, weight: 500, family: F.sans, color: C.red, align: 'center', ls: 1, mode: 'fade' }, t - 4.6, out);
        }
        // 2 · Bebida del momento (vaso)
        const a2 = sOut(11.3, 23.6);
        if (a2 > 0) {
          const d = KT.drink(feat.name), out = t > 23 ? t - 23 : null, smooth = d.k === 'smooth';
          KT.textIn(ctx, 'BEBIDA DEL MOMENTO', 90, 420, { size: 48, weight: 600, family: F.sans, color: C.red, ls: 5, stagger: 0.02 }, t - 11.8, out);
          const NT = KT.fitLines(ctx, feat.title, { size: 132, style: 'italic', family: F.serif }, 900, 110);
          let ny = 570; NT.lines.forEach((ln, i) => { KT.textIn(ctx, ln, 84, ny, Object.assign({ color: C.ink, mode: 'mask', stagger: 0.03 }, NT.o), t - 12.2 - i * 0.3, out); ny += NT.o.size * 0.98; });
          ny += 100 - NT.o.size * 0.98;
          KT.textIn(ctx, feat.es, 90, ny, { size: 56, weight: 500, family: F.sans, color: C.ink, mode: 'fade' }, t - 13.2, out);
          KT.textIn(ctx, feat.en, 90, ny + 66, { size: 48, weight: 400, family: F.sans, color: C.en, mode: 'fade' }, t - 13.5, out);
          ctx.save(); ctx.globalAlpha = a2;
          KT.cup(ctx, 730, 1580, 600, { drink: d, fill: seg(t, 13.4, 16.2), drop: smooth ? 0 : seg(t, 15.2, 18), top: smooth ? { type: null } : undefined, straw: smooth ? KT.mix(d.c1, '#FFFFFF', 0.25) : false, strawAng: 0.12, wave: (TAU * 24 * t) / L, seed: 4 });
          ctx.restore();
          const pa = KT.clamp((t - 16.6) / 0.8) * a2;
          KT.priceBlock(ctx, 90, 1300, d.p, { alpha: pa, rule: E.outCubic(KT.clamp((t - 16.6) / 0.8)) });
        }
        // 3 · La casa (koi): la mascota toma su Koi Tea
        const a3 = sOut(24.3, 36.6);
        if (a3 > 0) {
          const d = KT.drink('Koi Tea'), out = t > 36 ? t - 36 : null;
          KT.textIn(ctx, 'LA BEBIDA DE LA CASA', 90, 420, { size: 48, weight: 600, family: F.sans, color: C.red, ls: 5, stagger: 0.02 }, t - 24.8, out);
          KT.textIn(ctx, 'Koi Tea', 84, 590, { size: 170, style: 'italic', family: F.serif, color: C.ink, mode: 'mask', stagger: 0.05 }, t - 25.2, out);
          KT.textIn(ctx, 'Té verde y fruta en capas', 90, 690, { size: 56, weight: 500, family: F.sans, color: C.ink, mode: 'fade' }, t - 25.9, out);
          KT.textIn(ctx, 'Our house signature', 90, 756, { size: 48, weight: 400, family: F.sans, color: C.en, mode: 'fade' }, t - 26.2, out);
          const life = KT.mascotLife(t, L, 1.3), ma = KT.clamp((t - 25.4) / 0.9) * a3;
          if (ma > 0) {
            const sip = seg(t, 30.2, 31.6), level = 1 - 0.1 * E.inOutCubic(seg(t, 30.8, 31.6));
            ctx.save(); ctx.globalAlpha = ma;
            KT.mascot(ctx, 720, 1210 + life.bob * 0.6, 820, { blink: life.blink, finL: life.finL, finR: life.finR, whisk: life.whisk, dorsal: life.dorsal, sip: sip > 0 && sip < 1 ? sip : 0, level, lw: 10, tea: KT.mix(d.c1, d.c2, 0.5), teaLayers: d.layers, topType: 'jelly' });
            ctx.restore();
          }
          const pa = KT.clamp((t - 27.4) / 0.8) * a3;
          KT.priceBlock(ctx, 90, 1180, d.p, { alpha: pa, rule: E.outCubic(KT.clamp((t - 27.4) / 0.8)) });
        }
        // 4 · Té de Taiwán (hoja)
        const a4 = sOut(37.3, 48.6);
        if (a4 > 0) {
          const out = t > 48 ? t - 48 : null;
          KT.textIn(ctx, 'Té de Taiwán', 540, 520, { size: 150, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 37.8, out);
          KT.textIn(ctx, 'Hojas importadas de Taiwán', 540, 626, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 38.5, out);
          KT.textIn(ctx, 'Tea leaves imported from Taiwan', 540, 692, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 38.8, out);
          FRUIT.forEach((n, i) => {
            const d = KT.drink(n), cx = 250 + i * 290, p = seg(t, 39.2 + i * 0.4, 41.6 + i * 0.4), hiK = n === fruit ? KT.env(t, 41.4, 48.4, 0.8, 0.6) : 0;
            if (hiK > 0) { ctx.save(); ctx.globalAlpha = a4 * hiK * 0.9; ctx.drawImage(KT.glow('#FFE0A6', 220), cx - 220, 1240 - 220, 440, 440); ctx.restore(); }
            ctx.save(); ctx.globalAlpha = a4; KT.cup(ctx, cx, 1420, 400, { drink: d, fill: p, drop: seg(t, 40.6 + i * 0.4, 42.6 + i * 0.4), ice: true, wave: (TAU * 20 * t) / L, seed: i + 3 }); ctx.restore();
            KT.text(ctx, n.replace(' Green Tea', ''), cx, 1512, { size: 54, weight: 500, family: F.sans, color: C.ink, align: 'center', alpha: a4 * KT.clamp(p * 2) });
          });
          KT.textIn(ctx, 'Green tea · 85 MXN cada uno', 540, 1610, { size: 52, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 41.6, out);
        }
        // 5 · Etiquétanos
        const a5 = sOut(49.4, 59.6);
        if (a5 > 0) {
          const out = t > 59 ? t - 59 : null;
          KT.textIn(ctx, 'Etiquétanos', 540, 520, { size: 150, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 49.8, out);
          KT.textIn(ctx, 'Tag us in your photo', 540, 610, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 50.4, out);
          ctx.save(); ctx.globalAlpha = KT.clamp((t - 50.6) / 0.6) * a5; KT.qr(ctx, 540 - 170, 690, 340, { round: 0.32, radius: 26, light: '#FFFCF6', reveal: E.outCubic(seg(t, 50.6, 52)) }); ctx.restore();
          KT.textIn(ctx, '@koitea.mx', 540, 1170, { size: 100, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.03 }, t - 51.2, out);
          KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1270, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 51.8, out);
          KT.textIn(ctx, 'Promos & new drinks', 540, 1336, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 52.1, out);
        }
        // transición propia: el pulso baja de la línea de luz como un barrido suave en cada cambio de capítulo
        [11, 24, 37, 49].forEach(T => {
          const p = seg(t, T - 0.7, T + 0.5); if (p <= 0 || p >= 1) return;
          const y = LINE_Y + (1920 - LINE_Y) * E.inOutSine(p), a = 0.32 * Math.sin(Math.PI * p) * (1 - take);
          const gs = ctx.createLinearGradient(0, y - 220, 0, y + 220); gs.addColorStop(0, KT.rgba(LED, 0)); gs.addColorStop(0.5, KT.rgba(LED, a)); gs.addColorStop(1, KT.rgba(LED, 0));
          ctx.fillStyle = gs; ctx.fillRect(0, y - 220, 1080, 440);
        });
        if (take < 1) { ctx.save(); ctx.globalAlpha = 1 - take; cubes(ctx, t); ctx.restore(); }
        ctx.restore();
      }
      // ---- acorde de té (vuelta 3): cinco vertidos por pantalla, alineados a su marco, que drenan hacia el vaso ----
      if (cyc === 2 && t > 52 && t < 59.8) {
        const sets = { L: KT.MENU.milk.items, C: KT.MENU.fruit.items.slice(0, 5), R: KT.MENU.smooth.items.concat([KT.drink('Lichi Green Tea')]) };
        const drinks = sets[view.slot], bw = 156, gap = 58, sx = (1080 - (bw * 5 + gap * 4)) / 2;
        const slotIdx = { L: 0, C: 1, R: 2 }[view.slot];
        ctx.save(); ctx.translate(x0, 0);
        drinks.forEach((d, i) => {
          // caída escalonada: como máximo dos vertidos en movimiento por pantalla
          const s0 = 52.2 + slotIdx * 0.15 + i * 0.36, pFall = seg(t, s0, s0 + 0.7);
          const dr0 = 55.8 + i * 0.22 + slotIdx * 0.1, pDrain = seg(t, dr0, dr0 + 1.3);
          if (pFall > 0) pour(ctx, sx + i * (bw + gap), bw, d, pFall, pDrain, t, i * 1.3 + slotIdx);
        });
        ctx.restore();
        if (view.slot === 'C') {
          const cp = seg(t, 55.6, 58.6), ca = KT.env(t, 55.2, 59.6, 0.6, 0.6);
          if (ca > 0) {
            ctx.save(); ctx.translate(x0, 0); ctx.globalAlpha = ca;
            const r = 430 * (0.85 + 0.15 * E.outCubic(KT.clamp((t - 55.2) / 0.6)));
            ctx.fillStyle = '#FCF2E3'; ctx.beginPath(); ctx.arc(540, 1080, r, 0, TAU); ctx.fill();
            ctx.strokeStyle = KT.rgba(C.walnut, 0.5); ctx.lineWidth = 3; ctx.stroke();
            const d = KT.drink('Koi Tea');
            KT.cup(ctx, 540, 1300, 520, { drink: d, fill: E.inOutSine(KT.seg(cp, 0, 0.7)), drop: KT.seg(cp, 0.55, 1), ice: true, wave: (TAU * 20 * t) / L, seed: 11 });
            KT.text(ctx, 'KOI TEA', 540, 1400, { size: 70, weight: 600, family: F.logo, color: C.ink, align: 'center', ls: 12, alpha: KT.clamp((t - 56.6) / 0.6) });
            ctx.restore();
          }
        }
      }
      soffit(ctx, x0, activePulses(t, cyc));
    }
  });
})();
