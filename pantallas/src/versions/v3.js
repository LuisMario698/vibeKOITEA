/* Versión 3 · Estanque — las tres pantallas.
   Un solo estanque detrás de las tres pantallas. Los menús laterales son placas de papel que flotan quietas;
   los koi nadan en los márgenes, cruzan "bajo el muro" entre pantallas y señalan la bebida recomendada.
   Loop de 60 s × 3 vueltas. En la tercera vuelta, una toma de 7 s muestra el estanque completo (menú oculto ~4% del tiempo). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 60, seg = KT.seg, CX = KT.X0.C, RX = KT.X0.R;
  const W1 = '#C3D3C9', W2 = '#9EB7AA', W3 = '#7E9D8F';
  const FEAT = [
    { name: 'Koi Tea', es: 'La bebida de la casa', en: 'Our house signature', side: 'L', ice: true },
    { name: 'Taro Milk Tea', es: 'Cremoso, con taro', en: 'Creamy taro', side: 'L' },
    { name: 'Durazno Green Tea', es: 'Té verde con durazno', en: 'Peach green tea', side: 'L', ice: true }
  ];
  const PLATE = { x: 40, y: 190, w: 1000, h: 1696 };

  // rutas periódicas (60 s). A cruza a la izquierda (12–29 s); B cruza a la derecha (26–41 s).
  const routeA = KT.koi.paths.route([
    { t: 0, x: CX + 760, y: 1480 }, { t: 5, x: CX + 840, y: 980 }, { t: 9.5, x: CX + 420, y: 640 }, { t: 13, x: CX + 150, y: 300 },
    { t: 15.8, x: CX - 90, y: 150 }, { t: 18.2, x: 980, y: 108 }, { t: 21.6, x: 560, y: 96 }, { t: 24.6, x: 170, y: 120 },
    { t: 27.2, x: 400, y: 150 }, { t: 31, x: 900, y: 138 }, { t: 34.6, x: CX + 60, y: 210 }, { t: 38.4, x: CX + 300, y: 660 },
    { t: 43, x: CX + 120, y: 1260 }, { t: 48, x: CX + 330, y: 1760 }, { t: 53, x: CX + 820, y: 1820 }, { t: 57, x: CX + 940, y: 1720 }
  ], L);
  const routeB = KT.koi.paths.route([
    { t: 0, x: CX + 300, y: 1100 }, { t: 7, x: CX + 120, y: 1700 }, { t: 14, x: CX + 600, y: 1760 }, { t: 20, x: CX + 940, y: 1200 },
    { t: 25.6, x: CX + 960, y: 420 }, { t: 28.2, x: RX - 120, y: 170 }, { t: 30.8, x: RX + 240, y: 110 }, { t: 34, x: RX + 680, y: 98 },
    { t: 36.6, x: RX + 930, y: 130 }, { t: 38.6, x: RX + 690, y: 150 }, { t: 42.6, x: RX + 140, y: 150 }, { t: 46, x: CX + 1010, y: 300 },
    { t: 50, x: CX + 760, y: 700 }, { t: 55, x: CX + 520, y: 860 }
  ], L);
  const routeC = KT.koi.paths.orbit(CX + 560, 1180, 300, 420, L, 2, 1.2, -1);
  // rutas especiales de la toma (vuelta 3): los koi salen a nadar a las pantallas laterales
  const takeA = KT.koi.paths.route([{ t: 51, x: CX + 900, y: 1790 }, { t: 52, x: CX + 820, y: 1700 }, { t: 54.2, x: CX - 160, y: 1250 }, { t: 56.2, x: 620, y: 960 }, { t: 58.4, x: CX + 120, y: 1500 }, { t: 61, x: CX + 760, y: 1480 }, { t: 70, x: CX + 840, y: 1100 }], 1e6);
  const takeB = KT.koi.paths.route([{ t: 51, x: CX + 700, y: 740 }, { t: 52, x: CX + 640, y: 780 }, { t: 54.2, x: RX + 160, y: 820 }, { t: 56.2, x: RX + 520, y: 1180 }, { t: 58.4, x: CX + 900, y: 1200 }, { t: 61, x: CX + 300, y: 1100 }, { t: 70, x: CX + 120, y: 1700 }], 1e6);
  const blend = (p, q, k) => ({ x: KT.lerp(p.x, q.x, k), y: KT.lerp(p.y, q.y, k) });
  const takeW = (t, cyc) => (cyc === 2 ? KT.E.inOutSine(KT.env(t, 52, 59.6, 1.2, 1.4)) : 0);
  // los koi vuelven a su ruta normal antes del final (su cola guarda ~4 s de historia; así el loop empata)
  const koiW = (t, cyc) => (cyc === 2 ? KT.E.inOutSine(KT.env(t, 52, 56.4, 1.0, 1.6)) : 0);

  function causticTile() {
    return KT.sprite('v3caustic', 384, 384, (g, n) => {
      const img = g.createImageData(n, n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const u = (x / n) * TAU, w = (y / n) * TAU; let s = 0;
        for (let k = 1; k <= 3; k++) s += Math.sin(u * k + Math.sin(w * (k + 1) + k) * 1.3) * Math.cos(w * k - Math.sin(u * (k + 2)) * 1.1);
        const v = Math.pow(1 - Math.min(1, Math.abs(s) / 2.2), 7), i = (y * n + x) * 4;
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 245; img.data[i + 3] = Math.round(v * 255);
      }
      g.putImageData(img, 0, 0);
    });
  }
  // cáusticas: dos capas de mosaico que avanzan un número entero de mosaicos por loop (sin salto al repetir).
  // Se componen a 1/4 de resolución en un lienzo pequeño y se escalan: más barato y más suave, como luz en el agua.
  const CQ = 0.25;
  let cau = null;
  function caustics(ctx, x0, t, a) {
    const tile = causticTile();
    if (!cau) cau = KT.offscreen(1080 * CQ, 1920 * CQ);
    const g = cau.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cau.width, cau.height);
    g.setTransform(CQ, 0, 0, CQ, -x0 * CQ, 0);
    const layer = (size, ox, oy, alpha) => {
      g.globalAlpha = alpha;
      const sy = KT.wrap(oy, size);
      for (let y = -size + sy; y < 1920; y += size) for (let x = x0 - size + KT.wrap(ox - x0, size); x < x0 + 1080; x += size) g.drawImage(tile, x, y, size, size);
    };
    layer(384, (384 * t) / L, (768 * t) / L, 1);
    layer(614.4, (-614.4 * t) / L, (-1228.8 * t) / L, 0.7);
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(cau, x0, 0, 1080, 1920); ctx.restore();
  }
  function water(ctx, view, t) {
    const x0 = view.x0;
    const g = ctx.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, W1); g.addColorStop(0.5, W2); g.addColorStop(1, W3);
    ctx.fillStyle = g; ctx.fillRect(x0, 0, 1080, 1920);
    // profundidad: zonas más oscuras que derivan lento (en coordenadas del mundo, continuas entre pantallas)
    const blob = KT.sprite('v3blob', 256, 256, (g) => { const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, KT.rgba('#5E8073', 0.28)); rg.addColorStop(1, KT.rgba('#5E8073', 0)); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); });
    for (let k = 0; k < 5; k++) {
      const cx = 400 + k * 760 + Math.sin((TAU * t) / L + k) * 80, cy = 700 + (k % 2) * 700;
      if (cx < x0 - 700 || cx > x0 + 1780) continue;
      ctx.drawImage(blob, cx - 700, cy - 700, 1400, 1400);
    }
  }
  function lily(ctx, x, y, r, rot, flower) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(40,60,50,0.16)'; ctx.beginPath(); ctx.ellipse(10, 14, r, r * 0.96, 0, 0.2, TAU - 0.2); ctx.lineTo(10, 14); ctx.fill();
    ctx.fillStyle = '#93B07F'; ctx.beginPath(); ctx.arc(0, 0, r, 0.22, TAU - 0.22); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = KT.rgba(C.ink, 0.8); ctx.lineWidth = Math.max(2, r * 0.05); ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = KT.rgba(C.ink, 0.25); ctx.lineWidth = Math.max(1.5, r * 0.03); ctx.beginPath();
    for (let k = 0; k < 7; k++) { const a = 0.7 + (k / 6) * (TAU - 1.4); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); }
    ctx.stroke();
    if (flower) {
      ctx.translate(-r * 0.25, -r * 0.1);
      for (let k = 0; k < 8; k++) { ctx.save(); ctx.rotate((k / 8) * TAU); ctx.fillStyle = k % 2 ? '#F8E3DC' : '#FBEDE7'; ctx.beginPath(); ctx.ellipse(0, -r * 0.24, r * 0.1, r * 0.24, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = KT.rgba(C.ink, 0.5); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  const PADS = [
    { x: 150, y: 150, r: 58, f: false }, { x: 860, y: 62, r: 44, f: true }, { x: CX + 120, y: 200, r: 78, f: true }, { x: CX + 930, y: 140, r: 54, f: false },
    { x: CX + 980, y: 980, r: 70, f: false }, { x: CX + 80, y: 1560, r: 66, f: true }, { x: CX + 900, y: 1860, r: 60, f: false }, { x: RX + 300, y: 70, r: 50, f: false },
    { x: RX + 940, y: 150, r: 46, f: true }, { x: 520, y: 1900, r: 40, f: false }, { x: RX + 560, y: 1905, r: 38, f: false }
  ];
  function plateShadowSprite() {
    return KT.sprite('v3plate', 1080, 1840, (g) => {
      g.shadowColor = 'rgba(30,50,40,0.38)'; g.shadowBlur = 36; g.shadowOffsetX = 14; g.shadowOffsetY = 22;
      g.fillStyle = '#FBF3E8'; g.beginPath(); KT.rr(g, 40, 40, PLATE.w, PLATE.h, 30); g.fill();
    });
  }
  function plate(ctx, st, x, y, w, h, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(30,50,40,0.22)'; ctx.beginPath(); KT.rr(ctx, x + 12, y + 18, w, h, 30); ctx.fill();
    ctx.save(); ctx.beginPath(); KT.rr(ctx, x, y, w, h, 30); ctx.clip(); ctx.drawImage(st.paper, x, y, w, h); ctx.restore();
    ctx.restore();
  }

  KT.register({
    id: 'v3', n: 3, name: 'Estanque', format: 'triple', duration: L, cycles: 3, cycleLabel: 'Vuelta',
    takeover: { cycle: 2, t: 51.5, label: 'Ver la toma de las tres pantallas' },
    tagline: 'Un estanque detrás de las tres pantallas; el menú flota quieto y los koi cruzan bajo el muro.',
    chapters: [
      { t: 0, label: 'Estanque', note: 'Tres koi nadan entre nenúfares; la central presenta la marca.' },
      { t: 12, label: 'Recomendado', note: 'Un koi cruza a la pantalla izquierda y la bebida recomendada se resalta en el menú.' },
      { t: 28, label: 'Toppings', note: 'Otro koi cruza a la derecha, junto a los toppings; la central explica el topping incluido.' },
      { t: 40, label: 'Síguenos', note: 'QR a @koitea.mx con una razón para seguir.' },
      { t: 52, label: 'Calma', note: 'El kanji 鯉 y lo que el koi simboliza. En la tercera vuelta, las placas se apartan y el estanque ocupa las tres pantallas durante 7 s.' }
    ],
    info: {
      concept: 'Las tres pantallas son ventanas a un mismo estanque. Los menús de los lados son placas de papel que flotan sobre el agua y nunca se mueven; los koi nadan alrededor y cruzan de una pantalla a otra por detrás del muro, como si las pantallas fueran huecos en una pared. Cuando un koi llega a la pantalla izquierda, la bebida recomendada se resalta en el menú; la central la presenta con su precio.',
      why: 'El koi es la marca, y un estanque es su hábitat natural: no hace falta explicar nada. El agua usa el mismo verde salvia que hoy tienen las pantallas, así que el cambio se siente propio. El menú queda legible todo el tiempo y el movimiento vive en los márgenes y en la franja de arriba, donde además caen los reflejos de las lámparas.',
      signature: 'El koi entra al muro en una pantalla y sale por la de al lado justo a tiempo, sin cambiar de rumbo: el ojo lo lee como el mismo pez cruzando el local.',
      specs: [['Formato', '3 pantallas · lienzo de 3720 × 1920'], ['Loop', '60 s × 3 vueltas = 3 min'], ['Menú visible', '≈ 96% del tiempo'], ['Toma completa', '7 s cada 3 min'], ['Texto del menú', 'Nombres y precios 62 px, fijos'], ['Movimiento', '3 koi lentos, ~140 px/s al cruzar']]
    },
    setup() { return { paper: KT.paper(1000, 1700, '#FBF3E8', 41, 0.8), paperS: KT.paper(900, 900, '#FBF3E8', 42, 0.8) }; },
    draw(ctx, t, view, st) {
      const cyc = view.cycle || 0, f = FEAT[cyc], d = KT.drink(f.name), x0 = view.x0;
      water(ctx, view, t);
      caustics(ctx, x0, t, 0.2);
      // sombras profundas (koi lejanos)
      [[KT.koi.paths.orbit(CX + 540, 900, 380, 600, L, 1, 0.3, 1), 46], [KT.koi.paths.orbit(560, 1100, 360, 600, L, 1, 2.1, -1), 42], [KT.koi.paths.orbit(RX + 520, 1000, 360, 620, L, 1, 4.2, 1), 42]].forEach(([p, R], i) => {
        const P = KT.koi.spine(p, t, { len: R * 8.5 });
        if (P[0].x < x0 - 500 || P[0].x > x0 + 1580) return;
        KT.koi.draw(ctx, P, { R, style: 'shadow', phase: (TAU * 20 * t) / L + i, color: 'rgba(40,62,54,0.16)' });
      });
      // ondas al pasar los koi (deterministas)
      [[3.5, CX + 820, 1000], [18.2, 980, 110], [30.8, RX + 240, 110], [44, CX + 200, 1500], [57, CX + 700, 1700]].forEach(([tt, x, y]) => {
        const p = KT.wrap(t - tt, L) / 3.2; if (p > 0 && p < 1 && x > x0 - 300 && x < x0 + 1380) KT.ripple(ctx, x, y, p, { r: 200, color: '#FFFFFF', alpha: 0.5, lw: 3 });
      });
      // la toma: anillos grandes que se propagan por las tres pantallas
      const tw = takeW(t, cyc);
      if (tw > 0) {
        const rp = KT.seg(t, 52.2, 58.8);
        for (let k = 0; k < 3; k++) { const p = KT.clamp(rp * 1.3 - k * 0.15); if (p > 0 && p < 1) KT.ripple(ctx, CX + 540, 960, p, { r: 2300, squash: 0.62, rings: 2, color: '#FFFFFF', alpha: 0.55 * tw, lw: 6 }); }
      }
      // koi
      const tk = cyc === 2 && t > 51.5;
      const kA = tk ? s => blend(routeA(s), takeA(s), koiW(s, cyc)) : routeA;
      const kB = tk ? s => blend(routeB(s), takeB(s), koiW(s, cyc)) : routeB;
      const kois = [[kA, 40, 'mascot'], [kB, 36, 4], [routeC, 30, 9]];
      kois.forEach(([path, R, seed], i) => {
        const P = KT.koi.spine(path, t, { len: R * 8.4 });
        let minx = 1e9, maxx = -1e9; P.forEach(p => { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); });
        if (maxx < x0 - 200 || minx > x0 + 1280) return;
        KT.koi.draw(ctx, P, { R, style: 'line', phase: (TAU * 26 * t) / L + i * 2, seed, lw: R * 0.11 });
      });
      // nenúfares
      PADS.forEach((p, i) => { if (p.x > x0 - 120 && p.x < x0 + 1200) lily(ctx, p.x + Math.sin((TAU * t) / L + i) * 6, p.y + Math.cos((TAU * t) / L + i * 1.7) * 5, p.r, Math.sin((TAU * t) / L + i) * 0.15 + i, p.f); });

      // ---- pantallas laterales: menú en placa quieta ----
      if (view.slot !== 'C') {
        const pa = 1 - takeW(t, cyc);
        ctx.save(); ctx.translate(x0, 0);
        plate(ctx, st, PLATE.x, PLATE.y, PLATE.w, PLATE.h, pa);
        if (pa > 0) {
          const hiK = view.slot === f.side ? KT.env(t, 15.5, 39.5, 1.0, 1.2) : 0;
          KT.board(ctx, view.slot, { top: 236, alpha: pa, hi: { name: f.name, k: hiK } });
        }
        ctx.restore();
        return;
      }

      // ---- pantalla central ----
      ctx.save(); ctx.translate(x0, 0);
      const card = (a, x, y, w, h) => plate(ctx, { paper: st.paperS }, x, y, w, h, a);
      // escena 1: marca
      const a1 = KT.env(t, 0.2, 11.6, 1.0, 0.9);
      if (a1 > 0) {
        card(a1, 150, 700, 780, 470);
        KT.textIn(ctx, 'KOI TEA', 540, 900, { size: 128, weight: 800, family: F.round, color: C.ink, align: 'center', ls: 20, stagger: 0.06 }, t - 0.9, t > 11 ? t - 11 : null);
        KT.textIn(ctx, 'Boba shop', 540, 1000, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 1.8, t > 11 ? t - 11 : null);
        KT.textIn(ctx, 'Puerto Peñasco · Rocky Point', 540, 1070, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 2.1, t > 11 ? t - 11 : null);
        KT.hanko(ctx, 852, 760, 76, '鯉', { alpha: a1 * KT.clamp((t - 2.6) / 0.4), rot: 0.06 });
      }
      // escena 2: recomendado
      const a2 = KT.env(t, 12.2, 27.6, 1.0, 1.0);
      if (a2 > 0) {
        card(a2, 90, 330, 900, 1300);
        const out = t > 26.8 ? t - 26.8 : null;
        KT.textIn(ctx, 'RECOMENDADO', 540, 470, { size: 50, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 6, stagger: 0.02 }, t - 12.8, out);
        const NO = KT.fit(ctx, f.name, { size: 124, weight: 700, style: 'italic', family: F.serif }, 800, 96);
        KT.textIn(ctx, f.name, 540, 610, Object.assign({ color: C.ink, align: 'center', mode: 'mask', stagger: 0.03 }, NO), t - 13.2, out);
        KT.textIn(ctx, f.es, 540, 700, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 13.8, out);
        KT.textIn(ctx, f.en, 540, 764, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 14.1, out);
        ctx.save(); ctx.globalAlpha *= a2;
        KT.cup(ctx, 400, 1540, 640, { drink: d, fill: seg(t, 14.2, 17), drop: seg(t, 16, 19), ice: !!f.ice, sweat: 0.6, wave: (TAU * 30 * t) / L, seed: 7 });
        ctx.restore();
        const pa = KT.clamp((t - 17.5) / 0.8) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
        if (pa > 0) {
          KT.text(ctx, String(d.p), 810, 1210, { size: 140, weight: 600, family: F.sans, color: C.ink, align: 'center', alpha: pa });
          KT.text(ctx, 'MXN', 810, 1272, { size: 46, weight: 600, family: F.sans, color: C.ink, align: 'center', ls: 4, alpha: pa });
          KT.text(ctx, '≈ ' + KT.money(d.p, 'usd'), 810, 1340, { size: 46, weight: 500, family: F.sans, color: C.en, align: 'center', alpha: pa });
          // flecha discreta hacia la pantalla izquierda, donde el menú la resalta
          ctx.save(); ctx.globalAlpha *= pa; ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = 'round';
          const ax = 140, ay = 470 - 18; ctx.beginPath(); ctx.moveTo(ax + 60, ay); ctx.lineTo(ax, ay); ctx.moveTo(ax + 22, ay - 20); ctx.lineTo(ax, ay); ctx.lineTo(ax + 22, ay + 20); ctx.stroke(); ctx.restore();
        }
      }
      // escena 3: toppings
      const a3 = KT.env(t, 28.2, 39.6, 1.0, 1.0);
      if (a3 > 0) {
        card(a3, 110, 460, 860, 1060);
        const out = t > 38.8 ? t - 38.8 : null;
        KT.textIn(ctx, 'Tu bebida incluye', 540, 630, { size: 60, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 28.8, out);
        KT.textIn(ctx, '1 topping', 540, 790, { size: 150, weight: 700, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.05 }, t - 29.2, out);
        KT.textIn(ctx, 'Every drink includes 1 topping', 540, 880, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 29.8, out);
        const items = [['Tapioca', 'tapioca'], ['Perlas explosivas', 'pop'], ['Jellys', 'jelly']];
        items.forEach(([lab, kind], i) => {
          const cx = 250 + i * 290, by = 1260, ap = KT.clamp((t - 30.4 - i * 0.35) / 0.7) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
          if (ap <= 0) return;
          ctx.save(); ctx.globalAlpha *= ap;
          for (let k = 0; k < 6; k++) {
            const px = cx - 70 + (k % 3) * 70, py = by - 40 - Math.floor(k / 3) * 66 + Math.sin((TAU * 4 * t) / L + k + i) * 6;
            if (kind === 'tapioca') KT.pearl(ctx, px, py, 30); else if (kind === 'pop') KT.popPearl(ctx, px, py, 30, KT.MENU.toppings.pops.colors[(k + 1) % 6]); else KT.jelly(ctx, px, py, 54, KT.MENU.toppings.jellys.colors[k % 6], 0.2 * (k - 2));
          }
          ctx.restore();
          const lines = lab.split(' ');
          lines.forEach((ln, j) => KT.text(ctx, ln, cx, 1350 + j * 58, { size: 50, weight: 500, family: F.sans, color: C.ink, align: 'center', alpha: ap }));
        });
        ctx.save(); ctx.globalAlpha *= KT.clamp((t - 31.5) / 0.8) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
        ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = 'round'; const ax = 940, ay = 612; ctx.beginPath(); ctx.moveTo(ax - 60, ay); ctx.lineTo(ax, ay); ctx.moveTo(ax - 22, ay - 20); ctx.lineTo(ax, ay); ctx.lineTo(ax - 22, ay + 20); ctx.stroke(); ctx.restore();
      }
      // escena 4: síguenos
      const a4 = KT.env(t, 40.2, 51.6, 1.0, 1.0);
      if (a4 > 0) {
        card(a4, 150, 470, 780, 1180);
        const out = t > 50.8 ? t - 50.8 : null;
        KT.textIn(ctx, 'Síguenos', 540, 660, { size: 136, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 40.8, out);
        ctx.save(); ctx.globalAlpha *= KT.clamp((t - 41.4) / 0.6) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
        KT.qr(ctx, 540 - 165, 730, 330, { round: 0.32, radius: 24, reveal: E.outCubic(seg(t, 41.4, 42.8)), light: '#FFFDF8' });
        ctx.restore();
        KT.textIn(ctx, '@koitea.mx', 540, 1200, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.03 }, t - 42.2, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1300, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 42.8, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1370, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 43.1, out);
        KT.hanko(ctx, 540, 1510, 80, '鯉', { alpha: KT.clamp((t - 43.6) / 0.4) * (out != null ? 1 - KT.clamp(out / 0.6) : 1), rot: -0.05 });
      }
      // escena 5: calma (en la vuelta 3 coincide con la toma)
      const a5 = KT.env(t, 52.4, 59.6, 1.2, 1.2);
      if (a5 > 0) {
        const out = t > 58.8 ? t - 58.8 : null;
        card(a5, 170, 700, 740, 560);
        KT.textIn(ctx, '鯉', 540, 980, { size: 280, weight: 400, family: F.brush, color: C.ink, align: 'center', mode: 'fade', alpha: 0.8, stagger: 0 }, t - 52.6, out);
        KT.textIn(ctx, 'Perseverancia y buena fortuna', 540, 1120, { size: 54, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade', stagger: 0.01 }, t - 53.4, out);
        KT.textIn(ctx, 'Perseverance and good fortune', 540, 1184, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.01 }, t - 53.8, out);
      }
      ctx.restore();
    }
  });
})();
