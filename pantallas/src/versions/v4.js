/* Versión 4 · Luz — las tres pantallas.
   El plafón curvo con su tira LED continúa en las tres pantallas como una sola línea de luz cálida.
   La central sigue los cuatro cubos de luz del local (torii, boba, koi, hoja) como capítulos; cuando un capítulo
   habla de una bebida, un pulso de luz viaja por la línea hasta el menú lateral y la resalta.
   Loop de 60 s × 3 vueltas; en la tercera, el "acorde de té": cortinas de color de las bebidas caen de la línea (7 s). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 60, seg = KT.seg, CX = KT.X0.C, RX = KT.X0.R, WW = KT.WORLD3;
  const LED = '#FFD89A', LEDC = '#FFF3DC', SOFFIT = '#E4BF88', SOFFIT2 = '#D9AE72';
  const FEAT = ['Taro Milk Tea', 'Brown Sugar Milk Tea', 'Strawberry Milk Tea'];
  const FEAT_TXT = { 'Taro Milk Tea': ['Cremoso, con taro', 'Creamy taro'], 'Brown Sugar Milk Tea': ['Azúcar morena y tapioca', 'Brown sugar & tapioca'], 'Strawberry Milk Tea': ['Té con leche y fresa', 'Strawberry milk tea'] };
  const SMOOTH = ['Mango', 'Fresa', 'Maracuyá'];
  // curva del plafón en coordenadas del mundo (continúa por los huecos)
  const edgeY = x => 150 + 110 * Math.sin(Math.PI * KT.clamp(x / WW));
  // pulsos de luz: [inicio, x desde, x hasta, duración]
  const PULSES = [[0.2, -150, WW + 150, 14], [11.2, CX + 540, 540, 6.6], [24.2, CX + 540, 540, 6.6], [37.2, CX + 540, RX + 540, 6.6], [49.4, CX + 540, -150, 8], [49.4, CX + 540, WW + 150, 8]];
  const SCENES = [[0, 11], [11, 24], [24, 37], [37, 49], [49, 60]];

  function wall(ctx, x0, t, night) {
    const g = ctx.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, '#FCF2E3'); g.addColorStop(0.35, '#F8EBD8'); g.addColorStop(1, '#F0E0C9');
    ctx.fillStyle = g; ctx.fillRect(x0, 0, 1080, 1920);
  }
  function soffit(ctx, x0, t, pulses) {
    // relleno del plafón
    ctx.beginPath(); ctx.moveTo(x0 - 20, -10);
    for (let x = x0 - 20; x <= x0 + 1100; x += 20) ctx.lineTo(x, edgeY(x));
    ctx.lineTo(x0 + 1100, -10); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, SOFFIT2); g.addColorStop(1, SOFFIT);
    ctx.fillStyle = g; ctx.fill();
    // resplandor LED bajo el borde (bandas anchas y suaves)
    const glowPath = () => { ctx.beginPath(); for (let x = x0 - 20; x <= x0 + 1100; x += 20) { const y = edgeY(x); x === x0 - 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } };
    ctx.save(); ctx.lineCap = 'round';
    [[120, 0.06], [70, 0.09], [36, 0.14], [16, 0.32]].forEach(([w, a]) => { glowPath(); ctx.strokeStyle = KT.rgba(LED, a); ctx.lineWidth = w; ctx.stroke(); });
    glowPath(); ctx.strokeStyle = LEDC; ctx.lineWidth = 5; ctx.stroke();
    // pulsos
    pulses.forEach(([x, k]) => {
      if (x < x0 - 400 || x > x0 + 1480) return;
      const y = edgeY(x), r = 260 * k;
      ctx.globalAlpha = 0.85 * k; ctx.drawImage(KT.glow('#FFE2A8', 260), x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1; ctx.fillStyle = KT.rgba('#FFFFFF', 0.9 * k); ctx.beginPath(); ctx.ellipse(x, y, 60 * k, 7, Math.atan2(edgeY(x + 10) - edgeY(x - 10), 20), 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function activePulses(t) {
    const out = [];
    PULSES.forEach(([s, a, b, d]) => { const p = (t - s) / d; if (p > 0 && p < 1) out.push([KT.lerp(a, b, E.inOutSine(p)), Math.sin(Math.PI * p)]); });
    return out;
  }
  // marco tipo passe-partout con filete nogal (pantallas laterales)
  function frame(ctx) {
    ctx.strokeStyle = KT.rgba(C.walnut, 0.75); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.rect(40, 290, 1000, 1600); ctx.stroke();
    ctx.strokeStyle = KT.rgba(C.walnut, 0.22); ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(54, 304, 972, 1572); ctx.stroke();
  }
  const ICONS = ['torii', 'boba', 'koi', 'leaf'];
  function cubes(ctx, t, x0) {
    const sceneIdx = SCENES.findIndex(([a, b]) => t >= a && t < b);
    const size = 150, gap = 44, total = size * 4 + gap * 3, sx = 540 - total / 2, y = 1690;
    for (let i = 0; i < 4; i++) {
      const on = sceneIdx === 4 ? KT.seg(t, 49.6 + i * 0.25, 50.4 + i * 0.25) * (1 - KT.seg(t, 58.6 + i * 0.15, 59.5 + i * 0.15)) : (sceneIdx === i ? Math.min(KT.seg(t, SCENES[i][0] + 0.6, SCENES[i][0] + 1.6), 1 - KT.seg(t, SCENES[i][1] - 0.6, SCENES[i][1])) : 0);
      const x = sx + i * (size + gap);
      if (on > 0) { ctx.globalAlpha = on * 0.9; ctx.drawImage(KT.glow('#FFE0A6', 150), x + size / 2 - 150, y + size / 2 - 150, 300, 300); ctx.globalAlpha = 1; }
      ctx.fillStyle = KT.mix('#F3E6D3', '#FFF8EC', on); ctx.beginPath(); KT.rr(ctx, x, y, size, size, 16); ctx.fill();
      ctx.strokeStyle = KT.rgba(C.walnut, 0.35 + on * 0.4); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = KT.rgba(C.walnut, 0.9); ctx.fillRect(x + size - 14, y + 10, 6, size - 20);
      ctx.strokeStyle = KT.rgba(C.ink, 0.35 + on * 0.65); KT.icon[ICONS[i]](ctx, x + size / 2 - 4, y + size / 2, 96, 5);
    }
  }
  function layeredCup(ctx, cx, by, H, p, t) {
    // capas del Koi Tea formándose: primero el rojo, luego el naranja que baja
    const a = KT.lerp(0.95, 0.32, E.inOutCubic(KT.seg(p, 0.35, 1))), b = KT.lerp(1, 0.58, E.inOutCubic(KT.seg(p, 0.35, 1)));
    const layers = [[0, '#C81E3A'], [Math.min(a, 0.94), '#D8283F'], [Math.min(b, 0.97), '#F07A2E'], [1, '#F6B048']];
    KT.cup(ctx, cx, by, H, { drink: Object.assign({}, KT.drink('Koi Tea'), { layers }), fill: KT.seg(p, 0, 0.45), drop: KT.seg(p, 0.5, 0.9), ice: true, sweat: 0.7, wave: (TAU * 20 * t) / L, seed: 11 });
  }

  KT.register({
    id: 'v4', n: 4, name: 'Luz', format: 'triple', duration: L, cycles: 3, cycleLabel: 'Vuelta',
    takeover: { cycle: 2, t: 51.6, label: 'Ver el acorde de té (toma de 7 s)' },
    tagline: 'La línea de luz del plafón cruza las tres pantallas y enciende el menú.',
    chapters: [
      { t: 0, label: 'Origen', note: 'La tira de luz se enciende de izquierda a derecha. Cubo del torii: ingredientes de Taiwán.' },
      { t: 11, label: 'Bebida del momento', note: 'Cubo del vaso. Un pulso de luz viaja hasta el menú izquierdo y resalta la bebida.' },
      { t: 24, label: 'La casa', note: 'Cubo del koi. El Koi Tea forma sus capas de rojo a naranja.' },
      { t: 37, label: 'Para el calor', note: 'Cubo de la hoja. Smoothies; el pulso viaja a la pantalla derecha.' },
      { t: 49, label: 'Etiquétanos', note: 'Los cuatro cubos encendidos, QR a @koitea.mx. En la tercera vuelta, el acorde de té.' }
    ],
    info: {
      concept: 'El plafón curvo con su tira LED es lo primero que se ve al entrar, y está justo encima de las pantallas. Aquí esa curva continúa dentro de las tres pantallas como una sola línea de luz cálida. La central sigue los cuatro cubos de luz de la columna del local: torii, vaso, koi y hoja, uno por capítulo. Cuando un capítulo habla de una bebida, un pulso de luz viaja por la línea hasta el menú lateral y la resalta.',
      why: 'Es la versión más arquitectónica: no agrega un mundo nuevo, sino que extiende el que ya construyeron (plafón, LED, cubos con íconos, madera nogal). Los menús laterales se tratan como cuadros con passe-partout y filete de nogal, en diálogo con la galería del arco. Es sobria, de lectura muy clara y la que mejor se integra con la luz del local.',
      signature: 'El acorde de té: cada tres vueltas, cortinas con los colores de todas las bebidas caen de la línea de luz sobre las tres pantallas y se recogen en un vaso de Koi Tea.',
      specs: [['Formato', '3 pantallas · lienzo de 3720 × 1920'], ['Loop', '60 s × 3 vueltas = 3 min'], ['Menú visible', '≈ 96% del tiempo'], ['Acorde de té', '7 s cada 3 min'], ['Texto del menú', 'Nombres y precios 62 px, fijos'], ['Movimiento', 'Pulsos de luz lentos, sin destellos']]
    },
    setup() { return {}; },
    draw(ctx, t, view) {
      const cyc = view.cycle || 0, x0 = view.x0, feat = FEAT[cyc], smooth = SMOOTH[cyc];
      const take = cyc === 2 ? KT.env(t, 52, 59.6, 0.8, 0.9) : 0;
      wall(ctx, x0, t);
      // ---- laterales ----
      if (view.slot !== 'C') {
        ctx.save(); ctx.translate(x0, 0);
        const ba = 1 - take;
        if (ba > 0) {
          ctx.globalAlpha = ba; frame(ctx);
          let hi = null;
          if (view.slot === 'L') { const k = KT.env(t, 14.8, 23.6, 0.9, 0.9); const k2 = KT.env(t, 27.8, 36.6, 0.9, 0.9); hi = k > 0 ? { name: feat, k } : (k2 > 0 ? { name: 'Koi Tea', k: k2 } : null); }
          else { const k = KT.env(t, 40.8, 48.6, 0.9, 0.9); hi = k > 0 ? { name: smooth, k } : null; }
          KT.board(ctx, view.slot, { top: 318, hi, alpha: ba, scale: Math.min(1, (1868 - 318) / KT.boardHeight(view.slot)) });
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      // ---- central ----
      if (view.slot === 'C') {
        ctx.save(); ctx.translate(x0, 0);
        const sOut = (a, b) => KT.env(t, a, b, 0.8, 0.8) * (1 - take);
        // 1 · Origen (torii)
        const a1 = sOut(0.3, 10.6);
        if (a1 > 0) {
          ctx.save(); ctx.globalAlpha = a1; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
          const tp = E.ink(seg(t, 1.0, 3.6));
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, 380 + 560 * tp); ctx.clip(); KT.icon.torii(ctx, 540, 640, 420, 16); ctx.restore();
          ctx.restore();
          const out = t > 10 ? t - 10 : null;
          KT.textIn(ctx, 'KOI TEA', 540, 1060, { size: 128, weight: 800, family: F.round, color: C.ink, align: 'center', ls: 20, stagger: 0.06 }, t - 2.6, out);
          KT.textIn(ctx, 'Ingredientes de Taiwán', 540, 1180, { size: 60, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 3.6, out);
          KT.textIn(ctx, 'Ingredients from Taiwan', 540, 1250, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 3.9, out);
          KT.textIn(ctx, 'Puerto Peñasco', 540, 1400, { size: 54, weight: 500, family: F.sans, color: C.red, align: 'center', ls: 2, mode: 'fade' }, t - 4.6, out);
        }
        // 2 · Bebida del momento (vaso)
        const a2 = sOut(11.3, 23.6);
        if (a2 > 0) {
          const d = KT.drink(feat), out = t > 23 ? t - 23 : null, tx = FEAT_TXT[feat];
          KT.textIn(ctx, 'BEBIDA DEL MOMENTO', 90, 420, { size: 48, weight: 600, family: F.sans, color: C.red, ls: 5, stagger: 0.02 }, t - 11.8, out);
          const words = feat.split(' '), l1 = words.slice(0, words.length - 2).join(' '), l2 = words.slice(-2).join(' ');
          const NO = { size: 132, weight: 700, style: 'italic', family: F.serif, color: C.ink, mode: 'mask', stagger: 0.03 };
          KT.textIn(ctx, l1, 84, 570, NO, t - 12.2, out);
          KT.textIn(ctx, l2, 84, 700, NO, t - 12.5, out);
          KT.textIn(ctx, tx[0], 90, 800, { size: 56, weight: 500, family: F.sans, color: C.ink, mode: 'fade' }, t - 13.2, out);
          KT.textIn(ctx, tx[1], 90, 866, { size: 48, weight: 400, family: F.sans, color: C.en, mode: 'fade' }, t - 13.5, out);
          ctx.save(); ctx.globalAlpha = a2;
          KT.cup(ctx, 720, 1580, 640, { drink: d, fill: seg(t, 13.4, 16.2), drop: seg(t, 15.2, 18), sweat: 0.6, wave: (TAU * 24 * t) / L, seed: 4 });
          ctx.restore();
          const pa = KT.clamp((t - 16.6) / 0.8) * a2;
          KT.text(ctx, String(d.p), 90, 1200, { size: 150, weight: 600, family: F.sans, color: C.ink, alpha: pa });
          KT.text(ctx, 'MXN', 92, 1262, { size: 46, weight: 600, family: F.sans, color: C.ink, ls: 4, alpha: pa });
          KT.text(ctx, '≈ ' + KT.money(d.p, 'usd'), 92, 1330, { size: 46, weight: 500, family: F.sans, color: C.en, alpha: pa });
        }
        // 3 · La casa (koi)
        const a3 = sOut(24.3, 36.6);
        if (a3 > 0) {
          const d = KT.drink('Koi Tea'), out = t > 36 ? t - 36 : null;
          KT.textIn(ctx, 'LA BEBIDA DE LA CASA', 540, 410, { size: 48, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 5, stagger: 0.02 }, t - 24.8, out);
          KT.textIn(ctx, 'Koi Tea', 540, 600, { size: 190, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.05 }, t - 25.2, out);
          KT.textIn(ctx, 'Our house signature', 540, 690, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 25.9, out);
          ctx.save(); ctx.globalAlpha = a3; layeredCup(ctx, 540, 1580, 760, seg(t, 25.6, 33.6), t); ctx.restore();
          const pa = KT.clamp((t - 30.6) / 0.8) * a3;
          if (pa > 0) {
            ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(890, 1180, 116, 0, TAU); ctx.fill(); ctx.restore();
            KT.text(ctx, String(d.p), 890, 1206, { size: 104, weight: 600, family: F.sans, color: '#FFFFFF', align: 'center', alpha: pa });
            KT.text(ctx, 'MXN', 890, 1252, { size: 34, weight: 600, family: F.sans, color: '#FFFFFF', align: 'center', ls: 3, alpha: pa });
            KT.hanko(ctx, 196, 1000, 92, '鯉', { alpha: pa, rot: -0.08 });
          }
        }
        // 4 · Para el calor (hoja)
        const a4 = sOut(37.3, 48.6);
        if (a4 > 0) {
          const out = t > 48 ? t - 48 : null;
          KT.textIn(ctx, 'Smoothies', 540, 520, { size: 170, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 37.8, out);
          KT.textIn(ctx, 'Para el calor de Peñasco', 540, 630, { size: 58, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 38.5, out);
          KT.textIn(ctx, 'Beat the Rocky Point heat', 540, 696, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 38.8, out);
          ['Mango', 'Fresa', 'Maracuyá'].forEach((n, i) => {
            const d = KT.drink(n), cx = 200 + i * 340, p = seg(t, 39.2 + i * 0.4, 41.6 + i * 0.4);
            ctx.save(); ctx.globalAlpha = a4; KT.cup(ctx, cx, 1440, 480, { drink: d, fill: p, drop: 0, top: { type: null }, straw: KT.mix(d.c1, '#FFFFFF', 0.25), strawAng: 0.12, wave: (TAU * 20 * t) / L, seed: i }); ctx.restore();
            KT.text(ctx, n, cx, 1530, { size: 52, weight: 500, family: F.sans, color: C.ink, align: 'center', alpha: a4 * KT.clamp(p * 2) });
          });
          KT.textIn(ctx, '90 MXN cada uno', 540, 1630, { size: 56, weight: 600, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 41.6, out);
        }
        // 5 · Etiquétanos
        const a5 = sOut(49.4, 59.6);
        if (a5 > 0) {
          const out = t > 59 ? t - 59 : null;
          KT.textIn(ctx, 'Etiquétanos', 540, 520, { size: 150, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 49.8, out);
          KT.textIn(ctx, 'Tag us in your photo', 540, 610, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 50.4, out);
          ctx.save(); ctx.globalAlpha = KT.clamp((t - 50.6) / 0.6) * a5; KT.qr(ctx, 540 - 170, 690, 340, { round: 0.32, radius: 26, light: '#FFFCF6', reveal: E.outCubic(seg(t, 50.6, 52)) }); ctx.restore();
          KT.textIn(ctx, '@koitea.mx', 540, 1170, { size: 100, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.03 }, t - 51.2, out);
          KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1270, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 51.8, out);
          KT.textIn(ctx, 'Promos & new drinks', 540, 1336, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 52.1, out);
        }
        if (take < 1) { ctx.save(); ctx.globalAlpha = 1 - take; cubes(ctx, t, x0); ctx.restore(); }
        ctx.restore();
      }
      // ---- acorde de té (vuelta 3): cortinas de color que caen de la línea de luz ----
      if (take > 0) {
        const cols = [];
        ['milk', 'fruit', 'smooth'].forEach(k => KT.MENU[k].items.forEach(d => cols.push(d)));
        const n = cols.length, sw = WW / n;
        cols.forEach((d, i) => {
          const x = i * sw; if (x + sw < x0 || x > x0 + 1080) return;
          const drop = E.inOutCubic(seg(t, 52.3 + i * 0.09, 53.9 + i * 0.09));
          const lift = E.inOutCubic(seg(t, 56.2 + (n - i) * 0.05, 57.8 + (n - i) * 0.05));
          const top = edgeY(x + sw / 2) + 4, h = (1920 - top) * drop * (1 - lift);
          if (h <= 0) return;
          const g = ctx.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, KT.rgba(d.c2 || d.c1, 0.95)); g.addColorStop(1, KT.rgba(d.c1, 0.9));
          ctx.fillStyle = g; ctx.fillRect(x + 6, top, sw - 12, h);
        });
        if (view.slot === 'C') {
          const cp = seg(t, 55.4, 58.6), ca = KT.env(t, 55.2, 59.6, 0.6, 0.6);
          if (ca > 0) {
            ctx.save(); ctx.translate(x0, 0); ctx.globalAlpha = ca;
            ctx.fillStyle = KT.rgba('#FCF2E3', 0.9); ctx.beginPath(); ctx.arc(540, 1080, 520, 0, TAU); ctx.fill();
            layeredCup(ctx, 540, 1430, 640, cp, t);
            KT.text(ctx, 'KOI TEA', 540, 1560, { size: 96, weight: 800, family: F.round, color: C.ink, align: 'center', ls: 16, alpha: KT.clamp((t - 56.6) / 0.6) });
            ctx.restore();
          }
        }
      }
      soffit(ctx, x0, t, activePulses(t));
    }
  });
})();
