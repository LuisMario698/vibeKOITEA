/* Versión 3 · Estanque — las tres pantallas.
   Un solo estanque color té detrás de las tres pantallas. Los menús laterales son placas de papel que flotan quietas;
   dos koi nadan por las orillas (nunca bajo un texto), cruzan "bajo el muro" entre pantallas y señalan la bebida
   recomendada. Al final de cada vuelta giran juntos, cabeza con cola, alrededor de 鯉.
   Loop de 60 s × 3 vueltas. En la tercera vuelta las placas se apartan 7 s y el estanque ocupa las tres pantallas. */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 60, seg = KT.seg, CX = KT.X0.C, RX = KT.X0.R;
  // agua color té: cálida como la madera y la luz del local
  const W1 = '#EFE3D0', W2 = '#DCC6A6', W3 = '#C2A27C', DEEP = '#8C6A4E', SHADE = '#5A4232';
  const FEAT = [
    { name: 'Koi Tea', es: 'La bebida de la casa', en: 'Our house signature', side: 'L', ice: true },
    { name: 'Taro Milk Tea', es: 'Cremoso, con taro', en: 'Creamy taro', side: 'L' },
    { name: 'Durazno Green Tea', es: 'Té verde con durazno', en: 'Peach green tea', side: 'L', ice: true }
  ];
  const PLATE = { x: 40, y: 190, w: 1000, h: 1696 };
  // tarjetas de la central: x de 150 a 930; los koi nadan por fuera (orillas de 150 px y franjas de arriba y abajo)
  const CARD = { s1: [150, 680, 780, 520], s2: [150, 330, 780, 1300], s3: [150, 460, 780, 1060], s4: [150, 400, 780, 860], s5: [170, 960, 740, 290] };

  /* ---------- Rutas (60 s, periódicas) ----------
     Círculo de encuentro: centro (CX+540, 1560), radio 178, sentido horario a 45°/s (≈140 px/s).
     A entra por abajo, da 1¼ vueltas, sube por la orilla izquierda y cruza a la pantalla izquierda (18–26 s).
     B llega por la derecha (24–32 s), baja por la orilla derecha y entra al círculo; mientras los dos están en él
     (53.9–57.2 s) van en lados opuestos: cabeza con cola. Velocidad visible ≤ 150 px/s. */
  const O = { x: CX + 540, y: 1560 }, RC = 178, DEG = 45;
  const onC = a => ({ x: O.x + RC * Math.cos((a * Math.PI) / 180), y: O.y + RC * Math.sin((a * Math.PI) / 180) });
  const arc = (t0, a0, a1) => { const out = []; for (let a = a0; a <= a1 + 1e-6; a += 30) { const p = onC(a); out.push({ t: (t0 + (a - a0) / DEG) % L, x: p.x, y: p.y }); } return out; };
  // puntos antes de entrar al círculo, sobre su tangente y con el mismo espaciado
  const approach = (t0, a0, k) => {
    const p = onC(a0), tx = -Math.sin((a0 * Math.PI) / 180), ty = Math.cos((a0 * Math.PI) / 180), st = RC * (Math.PI / 6), out = [];
    for (let j = k; j > 0; j--) out.push({ t: (t0 - (j * 30) / DEG + L) % L, x: p.x - tx * st * j, y: p.y - ty * st * j });
    return out;
  };
  const TA = 53.9, TB = TA - (300 - 30) / DEG;   // A entra a 120°; B entra a 30° y va 180° adelante
  const P = (t, x, y) => ({ t, x, y });
  const routeA = KT.koi.paths.route([P(47.0, CX + 1200, 2300)].concat(approach(TA, 120, 7), arc(TA, 120, 540), [
    P(4.5, CX + 250, 1430), P(5.8, CX + 125, 1300), P(7.1, CX + 70, 1130), P(11.0, CX + 66, 600), P(13.5, CX + 56, 260), P(14.9, CX - 60, 130), P(15.8, CX - 170, 112),
    P(17.9, 900, 100), P(20.7, 520, 92), P(23.5, 150, 108), P(26.1, -200, 130), P(27.8, -430, 260),
    P(31.2, -380, 900), P(34, -250, 2250), P(40, 800, 2380), P(44.5, CX + 500, 2400)]), L);
  const routeB = KT.koi.paths.route([P(22.4, RX + 1480, 360), P(23.9, RX + 1260, 130), P(26.7, RX + 890, 106), P(29.5, RX + 510, 94), P(32.3, RX + 140, 104), P(34.5, CX + 1150, 118), P(36.1, CX + 1020, 290),
    P(39.2, CX + 1014, 710), P(42.5, CX + 1014, 1160), P(44.6, CX + 1000, 1420), P(46.3, CX + 880, 1560)].concat(arc(TB, 30, 450), [
    P(57.9, CX + 447, 1750), P(58.57, CX + 358, 1778), P(59.23, CX + 277, 1824), P(59.9, CX + 208, 1886), P(0.57, CX + 152, 1960), P(1.23, CX + 110, 2043),
    P(4, CX + 400, 2450), P(10, RX, 2500), P(16, RX + 1400, 2200), P(21, RX + 1450, 900)]), L);
  // la toma (vuelta 3): las placas se apartan
  const takeW = (t, cyc) => (cyc === 2 ? E.inOutSine(KT.env(t, 52, 59.6, 1.2, 1.2)) : 0);

  function causticTile() {
    return KT.sprite('v3caustic', 384, 384, (g, n) => {
      const img = g.createImageData(n, n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const u = (x / n) * TAU, w = (y / n) * TAU; let s = 0;
        for (let k = 1; k <= 3; k++) s += Math.sin(u * k + Math.sin(w * (k + 1) + k) * 1.3) * Math.cos(w * k - Math.sin(u * (k + 2)) * 1.1);
        const v = Math.pow(1 - Math.min(1, Math.abs(s) / 2.2), 7), i = (y * n + x) * 4;
        img.data[i] = 255; img.data[i + 1] = 248; img.data[i + 2] = 236; img.data[i + 3] = Math.round(v * 255);
      }
      g.putImageData(img, 0, 0);
    });
  }
  // agua: degradado, zonas profundas que derivan lento y cáusticas (dos capas de mosaico que avanzan un número
  // entero de mosaicos por loop, sin salto al repetir). Todo se compone a 1/4 de resolución en un lienzo pequeño
  // y se escala una sola vez: es contenido suave, así que no pierde calidad y cuesta 16 veces menos.
  const CQ = 0.25;
  let wq = null;
  function water(ctx, view, t, ca) {
    const x0 = view.x0, tile = causticTile();
    if (!wq) wq = KT.offscreen(1080 * CQ, 1920 * CQ);
    const g = wq.getContext('2d');
    g.setTransform(CQ, 0, 0, CQ, -x0 * CQ, 0); g.globalAlpha = 1;
    const gr = g.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, W1); gr.addColorStop(0.5, W2); gr.addColorStop(1, W3);
    g.fillStyle = gr; g.fillRect(x0, 0, 1080, 1920);
    // profundidad: zonas más oscuras (en coordenadas del mundo, continuas entre pantallas)
    const blob = KT.sprite('v3blob2', 256, 256, (b) => { const rg = b.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, KT.rgba(DEEP, 0.18)); rg.addColorStop(1, KT.rgba(DEEP, 0)); b.fillStyle = rg; b.fillRect(0, 0, 256, 256); });
    for (let k = 0; k < 5; k++) {
      const cx = 400 + k * 760 + Math.sin((TAU * t) / L + k) * 80, cy = 700 + (k % 2) * 700;
      if (cx < x0 - 700 || cx > x0 + 1780) continue;
      g.drawImage(blob, cx - 700, cy - 700, 1400, 1400);
    }
    const layer = (size, ox, oy, alpha) => {
      g.globalAlpha = alpha * ca;
      const sy = KT.wrap(oy, size);
      for (let y = -size + sy; y < 1920; y += size) for (let x = x0 - size + KT.wrap(ox - x0, size); x < x0 + 1080; x += size) g.drawImage(tile, x, y, size, size);
    };
    layer(384, (384 * t) / L, (768 * t) / L, 1);
    layer(614.4, (-614.4 * t) / L, (-1228.8 * t) / L, 0.7);
    g.globalAlpha = 1;
    ctx.drawImage(wq, x0, 0, 1080, 1920);
  }
  // nenúfar; bloom (0→1) abre la flor
  function lily(ctx, x, y, r, rot, flower, bloom) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = KT.rgba(SHADE, 0.16); ctx.beginPath(); ctx.ellipse(10, 14, r, r * 0.96, 0, 0.2, TAU - 0.2); ctx.lineTo(10, 14); ctx.fill();
    ctx.fillStyle = '#8E9A5B'; ctx.beginPath(); ctx.arc(0, 0, r, 0.22, TAU - 0.22); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = KT.rgba(C.ink, 0.7); ctx.lineWidth = Math.max(2, r * 0.05); ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = KT.rgba(C.ink, 0.22); ctx.lineWidth = Math.max(1.5, r * 0.03); ctx.beginPath();
    for (let k = 0; k < 7; k++) { const a = 0.7 + (k / 6) * (TAU - 1.4); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); }
    ctx.stroke();
    const b = bloom == null ? 1 : bloom;
    if (flower && b > 0) {
      ctx.translate(-r * 0.25, -r * 0.1); const k0 = E.outBack(KT.clamp(b));
      for (let k = 0; k < 8; k++) { ctx.save(); ctx.rotate((k / 8) * TAU + (1 - b) * 0.6); ctx.fillStyle = k % 2 ? '#F8E3DC' : '#FBEDE7'; ctx.beginPath(); ctx.ellipse(0, -r * 0.24 * k0, r * 0.1 * k0, r * 0.24 * k0, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = KT.rgba(C.ink, 0.5); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 0, r * 0.08 * k0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  const PADS = [
    { x: 150, y: 150, r: 58, f: false }, { x: 860, y: 62, r: 44, f: true }, { x: CX + 120, y: 200, r: 78, f: true }, { x: CX + 930, y: 140, r: 54, f: false },
    { x: CX + 980, y: 1860, r: 60, f: false }, { x: RX + 300, y: 70, r: 50, f: false }, { x: RX + 940, y: 150, r: 46, f: true }, { x: 520, y: 1900, r: 40, f: false }, { x: RX + 560, y: 1905, r: 38, f: false }
  ];
  // nenúfares que solo se ven cuando las placas se apartan (vuelta 3): florecen
  const HIDDEN_PADS = [
    { x: 300, y: 860, r: 74, f: true, b: 53.4 }, { x: 800, y: 1420, r: 62, f: true, b: 54.0 }, { x: 200, y: 1660, r: 50, f: false }, { x: 760, y: 420, r: 44, f: false },
    { x: RX + 270, y: 1240, r: 70, f: true, b: 53.7 }, { x: RX + 790, y: 680, r: 76, f: true, b: 53.2 }, { x: RX + 640, y: 1640, r: 48, f: false }, { x: RX + 330, y: 520, r: 40, f: false }
  ];

  KT.register({
    id: 'v3', n: 3, name: 'Estanque', format: 'triple', duration: L, cycles: 3, cycleLabel: 'Vuelta',
    takeover: { cycle: 2, t: 51.5, label: 'Ver la toma de las tres pantallas' },
    tagline: 'Un estanque color té detrás de las tres pantallas; el menú flota quieto y dos koi cruzan bajo el muro.',
    chapters: [
      { t: 0, label: 'Estanque', note: 'Un koi termina su círculo y sube por la orilla; la central presenta la marca.' },
      { t: 12, label: 'Recomendado', note: 'El koi cruza a la pantalla izquierda y la bebida recomendada se ilumina en el menú.' },
      { t: 28, label: 'Toppings', note: 'Otro koi recorre la pantalla derecha, sobre los toppings; la central explica el topping incluido.' },
      { t: 40, label: 'Síguenos', note: 'QR a @koitea.mx con una razón para seguir.' },
      { t: 52, label: 'Encuentro', note: 'Los dos koi giran cabeza con cola mientras se escribe 鯉. En la tercera vuelta las placas se apartan y el estanque ocupa las tres pantallas durante 7 s.' }
    ],
    info: {
      concept: 'Las tres pantallas son ventanas a un mismo estanque. Los menús de los lados son placas de papel que flotan sobre el agua y nunca se mueven; dos koi nadan por las orillas, sin pasar nunca bajo un texto, y cruzan de una pantalla a otra por detrás del muro, como si las pantallas fueran huecos en una pared. Cuando un koi llega a la pantalla izquierda, la bebida recomendada se ilumina en el menú y la central la presenta con su precio. Al final de cada vuelta los dos se encuentran y giran juntos alrededor de 鯉.',
      why: 'El koi es la marca y un estanque es su hábitat: no hace falta explicar nada. El agua tiene color de té, cálida como la madera y las lámparas del local, para que la pared no se enfríe. El menú queda legible todo el tiempo y el movimiento vive en las orillas y en la franja de arriba, donde además caen los reflejos de las lámparas.',
      signature: 'Los dos koi giran cabeza con cola, como en el dibujo de la marca, mientras 鯉 se escribe trazo por trazo en el centro. En la tercera vuelta las placas se apartan, florecen los nenúfares y las ondas cruzan las tres pantallas.',
      specs: [['Formato', '3 pantallas · lienzo de 3720 × 1920'], ['Loop', '60 s × 3 vueltas = 3 min'], ['Menú visible', '≈ 96% del tiempo'], ['Toma completa', '7 s cada 3 min'], ['Texto del menú', 'Nombres y precios 62 px, fijos'], ['Movimiento', '2 koi por las orillas, ≤ 150 px/s']]
    },
    setup() { return { paper: KT.paper(1000, 1700, '#FBF3E8', 41, 0.8), paperS: KT.paper(900, 1300, '#FBF3E8', 42, 0.8) }; },
    draw(ctx, t, view, st) {
      const cyc = view.cycle || 0, f = FEAT[cyc], d = KT.drink(f.name), x0 = view.x0;
      water(ctx, view, t, 0.28);
      const tw = takeW(t, cyc);
      // ondas al pasar los koi (deterministas) y, en la toma, anillos que cruzan las tres pantallas
      [[17.9, 900, 100], [29.5, RX + 510, 94], [TA + 0.4, O.x, O.y]].forEach(([tt, x, y]) => {
        const p = KT.wrap(t - tt, L) / 3.2; if (p > 0 && p < 1 && x > x0 - 300 && x < x0 + 1380) KT.ripple(ctx, x, y, p, { r: 220, color: '#FFF8EC', alpha: 0.6, lw: 3 });
      });
      // transición propia: en cada cambio de escena una onda nace del koi más cercano a la central
      [[12, routeA], [28, routeB], [40, routeB], [52, routeB]].forEach(([T, r]) => {
        const p = seg(t, T - 0.8, T + 1.4); if (p <= 0 || p >= 1) return;
        const h = r(T - 0.8); KT.ripple(ctx, h.x, h.y, p, { r: 1500, squash: 0.62, rings: 2, color: '#FFF8EC', alpha: 0.55, lw: 4 });
      });
      if (tw > 0) {
        const rp = seg(t, TA, 59.4);
        for (let k = 0; k < 3; k++) { const p = KT.clamp(rp * 1.3 - k * 0.15); if (p > 0 && p < 1) KT.ripple(ctx, O.x, O.y, p, { r: 2400, squash: 0.62, rings: 2, color: '#FFF8EC', alpha: 0.7 * tw, lw: 6 }); }
      }
      // nenúfares bajo las placas (solo visibles en la toma)
      if (tw > 0 && view.slot !== 'C') HIDDEN_PADS.forEach((p, i) => { if (p.x > x0 - 120 && p.x < x0 + 1200) lily(ctx, p.x + Math.sin((TAU * t) / L + i) * 5, p.y, p.r, i * 1.3, p.f, p.f ? seg(t, p.b, p.b + 1.6) : 1); });
      // 鯉 se escribe en el centro del círculo mientras los koi giran
      if (view.slot === 'C') {
        const ka = 1 - seg(t, 59.0, 59.7);
        if (t > TA && ka > 0) { ctx.save(); ctx.globalAlpha *= ka; KT.calli(ctx, '鯉', O.x, O.y, 168, t - TA - 0.2, { color: C.ink, speed: 1.25, weight: 0.1, seed: 21 }); ctx.restore(); }
      }
      // koi
      [[routeA, 40, 'mascot'], [routeB, 36, 4]].forEach(([path, R, seed], i) => {
        const P = KT.koi.spine(path, t, { len: R * 8.4 });
        let minx = 1e9, maxx = -1e9; P.forEach(p => { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); });
        if (maxx < x0 - 200 || minx > x0 + 1280) return;
        KT.koi.draw(ctx, P, { R, style: 'line', phase: (TAU * 26 * t) / L + i * 2, seed, lw: R * 0.11 });
      });
      // nenúfares
      PADS.forEach((p, i) => { if (p.x > x0 - 120 && p.x < x0 + 1200) lily(ctx, p.x + Math.sin((TAU * t) / L + i) * 6, p.y + Math.cos((TAU * t) / L + i * 1.7) * 5, p.r, Math.sin((TAU * t) / L + i) * 0.15 + i, p.f); });

      // ---- pantallas laterales: menú en placa quieta ----
      if (view.slot !== 'C') {
        const pa = 1 - tw;
        ctx.save(); ctx.translate(x0, 0);
        if (pa > 0) {
          const hiK = view.slot === f.side ? KT.env(t, 17.6, 39.5, 1.0, 1.2) : 0;
          if (hiK > 0) {
            KT.card(ctx, PLATE.x, PLATE.y, PLATE.w, PLATE.h, pa, { paper: st.paper, fillet: false, drop: [12, 16, 0.16, SHADE] });
            KT.board(ctx, view.slot, { top: 236, alpha: pa, hi: { name: f.name, k: hiK } });
          } else {
            // sin resaltado: placa y menú en un solo sprite (una sola capa por cuadro)
            const sp = KT.sprite('v3plate|' + view.slot, 1080, 1920, g => { KT.card(g, PLATE.x, PLATE.y, PLATE.w, PLATE.h, 1, { paper: st.paper, fillet: false, drop: [12, 16, 0.16, SHADE] }); KT.boardText(g, view.slot, { top: 236 }); }, { text: true });
            const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * pa; ctx.drawImage(sp, 0, 0, 1080, 1920); ctx.globalAlpha = a0;
          }
        }
        ctx.restore();
        return;
      }

      // ---- pantalla central ----
      ctx.save(); ctx.translate(x0, 0);
      const card = (a, r) => KT.card(ctx, r[0], r[1], r[2], r[3], a, { paper: st.paperS, drop: [10, 14, 0.14, SHADE] });
      const fadeOut = (out) => (out != null ? 1 - KT.clamp(out / 0.6) : 1);
      // escena 1: marca
      const a1 = KT.env(t, 0.2, 11.6, 1.0, 0.9);
      if (a1 > 0) {
        const out = t > 11 ? t - 11 : null;
        card(a1, CARD.s1);
        KT.textIn(ctx, 'KOI TEA', 540, 870, { size: 112, weight: 600, family: F.logo, color: C.ink, align: 'center', ls: 18, stagger: 0.06 }, t - 0.9, out);
        KT.textIn(ctx, 'Boba shop', 540, 960, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 1.8, out);
        KT.textIn(ctx, 'Puerto Peñasco · Rocky Point', 540, 1030, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 2.1, out);
        const sa = KT.clamp((t - 2.8) / 0.4) * fadeOut(out);
        if (sa > 0) KT.hanko(ctx, 540, 1112, 64, '鯉', { alpha: sa, scale: 1 + (1 - E.outCubic(KT.clamp((t - 2.8) / 0.4))) * 0.5, rot: 0.04 });
      }
      // escena 2: recomendado
      const a2 = KT.env(t, 12.2, 27.6, 1.0, 1.0);
      if (a2 > 0) {
        card(a2, CARD.s2);
        const out = t > 26.8 ? t - 26.8 : null;
        KT.textIn(ctx, 'RECOMENDADO', 540, 452, { size: 50, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 6, stagger: 0.02 }, t - 12.8, out);
        const NT = KT.fitLines(ctx, f.name, { size: 124, style: 'italic', family: F.serif }, 620, 104);
        let ny = 590; NT.lines.forEach((ln, i) => { KT.textIn(ctx, ln, 540, ny, Object.assign({ color: C.ink, align: 'center', mode: 'mask', stagger: 0.03 }, NT.o), t - 13.2 - i * 0.25, out); ny += NT.o.size * 1.02; });
        ny += 70 - NT.o.size * 1.02;
        KT.textIn(ctx, f.es, 540, ny, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 13.8, out);
        KT.textIn(ctx, f.en, 540, ny + 62, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 14.1, out);
        ctx.save(); ctx.globalAlpha *= a2;
        KT.cup(ctx, 400, 1560, 560, { drink: d, fill: seg(t, 14.2, 17), drop: seg(t, 16, 19), ice: !!f.ice, wave: (TAU * 30 * t) / L, seed: 7 });
        ctx.restore();
        const pa = KT.clamp((t - 17.5) / 0.8) * fadeOut(out);
        if (pa > 0) {
          KT.priceBlock(ctx, 650, 1300, d.p, { alpha: pa, rule: E.outCubic(KT.clamp((t - 17.5) / 0.8)) });
          // flecha discreta hacia la pantalla izquierda, donde el menú la ilumina
          ctx.save(); ctx.globalAlpha *= pa; ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = 'round';
          const ax = 196, ay = 452 - 18; ctx.beginPath(); ctx.moveTo(ax + 60, ay); ctx.lineTo(ax, ay); ctx.moveTo(ax + 22, ay - 20); ctx.lineTo(ax, ay); ctx.lineTo(ax + 22, ay + 20); ctx.stroke(); ctx.restore();
        }
      }
      // escena 3: toppings
      const a3 = KT.env(t, 28.2, 39.6, 1.0, 1.0);
      if (a3 > 0) {
        card(a3, CARD.s3);
        const out = t > 38.8 ? t - 38.8 : null;
        KT.textIn(ctx, 'Tu bebida incluye', 540, 630, { size: 60, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 28.8, out);
        KT.textIn(ctx, '1 topping', 540, 790, { size: 150, weight: 700, family: F.sans, color: C.red, align: 'center', mode: 'mask', stagger: 0.05 }, t - 29.2, out);
        KT.textIn(ctx, 'Every drink includes 1 topping', 540, 880, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 29.8, out);
        const items = [['Tapioca', 'tapioca'], ['Perlas explosivas', 'pop'], ['Jellys', 'jelly']];
        items.forEach(([lab, kind], i) => {
          const cx = 290 + i * 250, by = 1260, ap = KT.clamp((t - 30.4 - i * 0.35) / 0.7) * fadeOut(out);
          if (ap <= 0) return;
          ctx.save(); ctx.globalAlpha *= ap;
          for (let k = 0; k < 6; k++) {
            const px = cx - 64 + (k % 3) * 64, py = by - 40 - Math.floor(k / 3) * 62 + Math.sin((TAU * 4 * t) / L + k + i) * 6;
            if (kind === 'tapioca') KT.pearl(ctx, px, py, 28); else if (kind === 'pop') KT.popPearl(ctx, px, py, 28, KT.MENU.toppings.pops.colors[(k + 1) % 6]); else KT.jelly(ctx, px, py, 50, KT.MENU.toppings.jellys.colors[k % 6], 0.2 * (k - 2));
          }
          ctx.restore();
          lab.split(' ').forEach((ln, j) => KT.text(ctx, ln, cx, 1350 + j * 58, { size: 50, weight: 500, family: F.sans, color: C.ink, align: 'center', alpha: ap }));
        });
        ctx.save(); ctx.globalAlpha *= KT.clamp((t - 31.5) / 0.8) * fadeOut(out);
        ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = 'round'; const ax = 884, ay = 612; ctx.beginPath(); ctx.moveTo(ax - 60, ay); ctx.lineTo(ax, ay); ctx.moveTo(ax - 22, ay - 20); ctx.lineTo(ax, ay); ctx.lineTo(ax - 22, ay + 20); ctx.stroke(); ctx.restore();
      }
      // escena 4: síguenos
      const a4 = KT.env(t, 40.2, 51.6, 1.0, 1.0);
      if (a4 > 0) {
        card(a4, CARD.s4);
        const out = t > 50.8 ? t - 50.8 : null;
        KT.textIn(ctx, 'Síguenos', 540, 560, { size: 136, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 40.8, out);
        ctx.save(); ctx.globalAlpha *= KT.clamp((t - 41.4) / 0.6) * fadeOut(out);
        KT.qr(ctx, 540 - 165, 610, 330, { round: 0.32, radius: 24, reveal: E.outCubic(seg(t, 41.4, 42.8)), light: '#FFFDF8' });
        ctx.restore();
        KT.textIn(ctx, '@koitea.mx', 540, 1052, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.03 }, t - 42.2, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1140, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 42.8, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1204, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 43.1, out);
      }
      // escena 5: encuentro (el círculo de los koi queda debajo de la tarjeta)
      const a5 = KT.env(t, 52.4, 59.6, 1.2, 1.2);
      if (a5 > 0) {
        const out = t > 58.8 ? t - 58.8 : null;
        card(a5, CARD.s5);
        KT.textIn(ctx, 'El koi simboliza', 540, 1042, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.01 }, t - 52.6, out);
        const pf = KT.fit(ctx, 'perseverancia y buena fortuna', { size: 58, weight: 500, family: F.sans }, 640, 50);
        KT.textIn(ctx, 'perseverancia y buena fortuna', 540, 1118, Object.assign({ color: C.ink, align: 'center', mode: 'fade', stagger: 0.01 }, pf), t - 53.0, out);
        KT.textIn(ctx, 'Perseverance and good fortune', 540, 1184, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.01 }, t - 53.4, out);
      }
      ctx.restore();
    }
  });
})();
