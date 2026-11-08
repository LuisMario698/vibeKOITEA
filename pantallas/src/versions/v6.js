/* Versión 6 · Letrero — solo pantalla central.
   Nace del letrero de la fachada: las letras de canal rojas de «KOI TEA» (redibujadas en 3D a partir de la foto)
   y la caja de luz blanca de «BOBA SHOP». Cuatro secciones por vuelta: marca, bebida del momento en 3D, sabor y
   arte, y el QR con la información. Entre secciones pasa una cinta roja inclinada como las letras del letrero.
   Loop de 44 s × 3 vueltas (una bebida distinta por vuelta). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 44, seg = KT.seg, SL = -0.2;               // inclinación de los titulares = la del letrero
  const SIGN_RED = '#E8452B', SLATE = '#3E4652', WALL = '#F4EEE6';
  const FEAT = [
    { name: 'Koi Tea', es: 'La bebida de la casa', en: 'Our house signature', ice: true },
    { name: 'Taro Milk Tea', es: 'Cremoso, con taro y tapioca', en: 'Creamy taro with tapioca' },
    { name: 'Brown Sugar Milk Tea', es: 'Azúcar morena y tapioca', en: 'Brown sugar & tapioca' }
  ];
  // secciones y cortinillas: la nueva entra desde la izquierda detrás de la cinta
  const WIPES = [10, 24, 33], WD = 1.0;
  const SCN = [[0, 10 + WD / 2], [10 - WD / 2, 24 + WD / 2], [24 - WD / 2, 33 + WD / 2], [33 - WD / 2, L]];

  // texto inclinado como el letrero (cizalla alrededor de la línea base)
  function slant(ctx, s, x, y, o, lt, out) { ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, SL, 1, 0, 0); const w = KT.textIn(ctx, s, 0, 0, o, lt, out); ctx.restore(); return w; }
  function slantText(ctx, s, x, y, o) { ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, SL, 1, 0, 0); KT.text(ctx, s, 0, 0, o); ctx.restore(); }

  // la caja de luz de «BOBA SHOP»: blanca, filete rojo y texto pizarra espaciado; on (0→1) la enciende
  function lightbox(ctx, cx, cy, w, h, on, a, label, size) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    if (on > 0) { const g = ctx.createRadialGradient(cx, cy, h * 0.4, cx, cy, w * 0.62); g.addColorStop(0, KT.rgba('#FFF4DF', 0.55 * on)); g.addColorStop(1, KT.rgba('#FFF4DF', 0)); ctx.fillStyle = g; ctx.fillRect(cx - w, cy - w * 0.62, w * 2, w * 1.24); }
    ctx.fillStyle = KT.rgba('#5A4232', 0.14); ctx.beginPath(); KT.rr(ctx, cx - w / 2 + 6, cy - h / 2 + 10, w, h, h / 2); ctx.fill();
    ctx.fillStyle = KT.mix('#E9E3DA', '#FFFFFF', on); ctx.beginPath(); KT.rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = KT.rgba('#B8321C', 0.85); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    KT.text(ctx, label, cx, cy + size * 0.36, { size, weight: 400, family: F.sans, color: SLATE, align: 'center', ls: size * 0.42, alpha: a * (0.35 + 0.65 * on) });
  }

  // «sabor» lleno con la bebida de la vuelta: capas, superficie que ondula, perlas al fondo y burbujas
  let lq = null, lq2 = null;
  function liquidWord(ctx, word, cx, base, size, d, lv, t, outlineA) {
    const W = 1080, H = Math.ceil(size * 1.25), oy = Math.round(size * 0.98);
    if (!lq) lq = KT.offscreen(W, H);
    const g = lq.getContext('2d'), font = KT.font({ size, weight: 700, family: F.sans });
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.save(); g.translate(cx, oy); g.transform(1, 0, SL, 1, 0, 0); g.font = font; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(word, 0, 0); g.restore();
    const top = oy - size * 0.74, bot = oy + 4, lvY = bot - (bot - top + 24) * E.inOutSine(KT.clamp(lv));
    g.globalCompositeOperation = 'source-in';
    if (lv > 0) {
      const layers = d.layers || [[0, d.c1], [1, d.c2 || d.c1]];
      const gr = g.createLinearGradient(0, bot, 0, top); layers.forEach(([u, c]) => gr.addColorStop(u, c)); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 12) g.lineTo(x, lvY + Math.sin(x / 58 + t * 3.1) * 7 + Math.sin(x / 23 - t * 2.3) * 3); g.lineTo(W, H); g.closePath(); g.fill();
      g.globalCompositeOperation = 'source-atop';
      // perlas de tapioca asentadas y burbujas que suben
      const pr = size * 0.055;
      for (let k = 0; k < 26; k++) { const x = cx - size * 1.45 + k * size * 0.115 + (k % 2) * pr * 0.6, y = bot - pr * (k % 2 ? 2.6 : 1.1); if (y < lvY) continue; const pg = g.createRadialGradient(x - pr * 0.3, y - pr * 0.35, pr * 0.1, x, y, pr); pg.addColorStop(0, '#6B4130'); pg.addColorStop(1, '#1E0F08'); g.fillStyle = pg; g.beginPath(); g.arc(x, y, pr, 0, TAU); g.fill(); }
      for (let k = 0; k < 14; k++) { const ph = KT.wrap(t * 0.35 + KT.hash(k * 3.7), 1), x = cx - size * 1.3 + KT.hash(k * 1.9) * size * 2.6, y = bot - (bot - lvY) * ph; if (y < lvY + 6) continue; g.fillStyle = KT.rgba('#FFFFFF', 0.45 * (1 - ph)); g.beginPath(); g.arc(x, y, 3 + KT.hash(k) * 5, 0, TAU); g.fill(); }
    }
    g.globalCompositeOperation = 'source-over';
    if (lv > 0) ctx.drawImage(lq, 0, base - oy, W, H); // sin líquido todavía, solo se ve el contorno
    // contorno en tinta: deja ver la letra vacía mientras se llena
    if (outlineA > 0) { ctx.save(); ctx.translate(cx, base); ctx.transform(1, 0, SL, 1, 0, 0); ctx.font = font; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = KT.rgba(C.ink, 0.85 * outlineA); ctx.lineWidth = 5; ctx.strokeText(word, 0, 0); ctx.restore(); }
  }
  // «arte» pintado a pincel: el texto aparece solo donde ya pasó la brocha
  function brushedWord(ctx, word, cx, base, size, p) {
    if (p <= 0) return;
    const W = 1080, H = Math.ceil(size * 1.3), oy = Math.round(size * 0.95);
    if (!lq2) lq2 = KT.offscreen(W, H);
    const g = lq2.getContext('2d'), o = { size, style: 'italic', family: F.serif }, tw = KT.measure(g, word, o);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    const x0 = cx - tw / 2 - 40, x1 = cx + tw / 2 + 60, yc = oy - size * 0.33;
    const pts = KT.cubicPts([x0, yc + 30], [x0 + (x1 - x0) * 0.35, yc - 40], [x0 + (x1 - x0) * 0.65, yc + 40], [x1, yc - 20], 60);
    KT.brush(g, pts, p, { w: size * 1.05, color: '#000', taperIn: 0.02, taperOut: 0.04 });
    g.globalCompositeOperation = 'source-in'; KT.text(g, word, cx, oy, Object.assign({ color: C.ink, align: 'center' }, o));
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(lq2, 0, base - oy, W, H);
  }
  // íconos de la ficha de información
  function iconClock(ctx, x, y, r) { ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x, y - r * 0.55); ctx.lineTo(x, y); ctx.lineTo(x + r * 0.45, y + r * 0.25); ctx.stroke(); ctx.restore(); }
  function iconPin(ctx, x, y, r) { ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x, y + r * 1.15); ctx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.9, y - r * 1.25, x, y - r * 1.2); ctx.bezierCurveTo(x + r * 0.9, y - r * 1.25, x + r * 1.3, y - r * 0.1, x, y + r * 1.15); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.32, 0, TAU); ctx.stroke(); ctx.restore(); }

  // ---------- secciones ----------
  function sMarca(ctx, t, st) {
    const life = KT.mascotLife(t, L, 0.8);
    KT.mascot(ctx, 540, 600 + life.bob * 0.5, 640, { draw: E.inOutSine(seg(t, 0.3, 2.3)), fill: E.soft(seg(t, 2.0, 2.9)), blink: life.blink, finL: life.finL, finR: life.finR, whisk: life.whisk, dorsal: life.dorsal, lw: 10, tea: C.milk });
    const sw = seg(t, 4.1, 5.5);
    KT.sign3d.draw(ctx, 540, 1150, 1010, { intro: seg(t, 1.5, 3.9), sweep: sw > 0 && sw < 1 ? sw * 2 - 1 : null, yaw: -0.09 + 0.07 * Math.sin((TAU * t) / L) });
    lightbox(ctx, 540, 1352, 720, 116, E.inOutSine(seg(t, 4.6, 5.4)), seg(t, 4.2, 4.7), 'BOBA SHOP', 58);
    KT.textIn(ctx, 'Puerto Peñasco · Rocky Point', 540, 1530, { size: 50, weight: 500, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.015 }, t - 5.8, null);
    KT.textIn(ctx, 'Boba de calidad, sabor auténtico', 540, 1610, { size: 54, weight: 500, family: F.sans, color: C.red, align: 'center', mode: 'fade', stagger: 0.012 }, t - 6.4, null);
  }
  function sBebida(ctx, t, st, f, d) {
    KT.textIn(ctx, 'BEBIDA DEL MOMENTO', 540, 300, { size: 48, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 6, mode: 'fade', stagger: 0.01 }, t - 10.6, null);
    const NT = KT.fitLines(ctx, f.name, { size: 124, weight: 700, family: F.sans }, 880, 104);
    let y = 440; NT.lines.forEach((ln, i) => { slant(ctx, ln, 540, y, Object.assign({ color: C.ink, align: 'center', mode: 'mask', stagger: 0.03, dur: 1.0 }, NT.o), t - 10.9 - i * 0.25, null); if (i < NT.lines.length - 1) y += NT.o.size * 1.0; });
    KT.textIn(ctx, f.es, 540, y + 88, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade', stagger: 0.01 }, t - 11.6, null);
    KT.textIn(ctx, f.en, 540, y + 152, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.01 }, t - 11.9, null);
    // luz de estudio detrás del vaso
    const ga = seg(t, 10.4, 11.6); if (ga > 0) { const g = ctx.createRadialGradient(410, 1360, 40, 410, 1360, 560); g.addColorStop(0, KT.rgba('#FFF6E8', 0.9 * ga)); g.addColorStop(1, KT.rgba('#FFF6E8', 0)); ctx.fillStyle = g; ctx.fillRect(0, 760, 1080, 1160); }
    const rise = 1 - E.outCubic(seg(t, 10.3, 12.0));
    const s3 = {
      t, alpha: seg(t, 10.3, 10.9), pearls: seg(t, 12.0, 13.2), fill: seg(t, 12.8, 15.2), ice: f.ice ? seg(t, 14.8, 15.6) : 0,
      seal: seg(t, 15.8, 16.4), straw: seg(t, 16.6, 17.4), cond: seg(t, 16.4, 19.0),
      spin: -2.2 * (1 - E.outCubic(seg(t, 10.3, 12.8))) + 0.3 * Math.sin((TAU * (t - 10.3)) / 12),
      strawColor: d.k === 'fruit' ? SIGN_RED : d.k === 'brown' ? '#3A2A22' : '#8C6FB4', fadeTop: y + 190
    };
    const by = 1760 + rise * 300;
    if (!KT.drink3d.draw(ctx, 410, by, 820, d, s3)) { ctx.save(); ctx.globalAlpha *= s3.alpha; KT.cup(ctx, 410, by, 760, { drink: d, fill: s3.fill, drop: s3.pearls, ice: !!f.ice, straw: false, seed: 3 }); ctx.restore(); }
    const pa = seg(t, 15.4, 16.2);
    KT.priceBlock(ctx, 770, 1330, d.p, { alpha: pa, rule: E.outCubic(pa) });
  }
  function sArte(ctx, t, st, d) {
    KT.textIn(ctx, 'El', 540, 730, { size: 72, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 24.4, null);
    liquidWord(ctx, 'sabor', 540, 1010, 260, d, seg(t, 25.0, 27.4), t, seg(t, 24.5, 25.0));
    KT.textIn(ctx, 'y el', 540, 1140, { size: 72, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 27.2, null);
    brushedWord(ctx, 'arte', 540, 1400, 270, E.inOutSine(seg(t, 27.4, 28.6)));
    const sa = seg(t, 28.7, 29.1); if (sa > 0) KT.hanko(ctx, 850, 1460, 78, '鯉', { alpha: KT.clamp(sa * 2), scale: 1 + (1 - E.outCubic(sa)) * 0.5, rot: -0.05 });
    KT.textIn(ctx, 'se unen en un mismo espacio', 540, 1600, { size: 60, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade', stagger: 0.012 }, t - 29.0, null);
    KT.textIn(ctx, 'Where flavor meets art', 540, 1676, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.012 }, t - 29.4, null);
  }
  function sInfo(ctx, t, st) {
    const sw = seg(t, 35.2, 36.4);
    KT.sign3d.draw(ctx, 540, 330, 760, { intro: seg(t, 33.2, 34.8), sweep: sw > 0 && sw < 1 ? sw * 2 - 1 : null, yaw: 0.06 * Math.sin((TAU * t) / L) });
    slant(ctx, 'Síguenos', 540, 610, { size: 112, weight: 700, family: F.sans, color: C.ink, align: 'center', mode: 'mask', stagger: 0.03 }, t - 33.8, null);
    const qa = seg(t, 34.2, 34.8);
    if (qa > 0) {
      ctx.save(); ctx.globalAlpha *= qa;
      ctx.fillStyle = KT.rgba('#5A4232', 0.12); ctx.beginPath(); KT.rr(ctx, 540 - 215 + 6, 680 + 10, 430, 430, 36); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); KT.rr(ctx, 540 - 215, 680, 430, 430, 36); ctx.fill(); ctx.strokeStyle = KT.rgba('#B8321C', 0.85); ctx.lineWidth = 4; ctx.stroke();
      KT.qr(ctx, 540 - 185, 710, 370, { round: 0.3, radius: 18, reveal: E.outCubic(seg(t, 34.2, 35.4)), light: '#FFFFFF', dark: C.ink });
      ctx.restore();
    }
    KT.textIn(ctx, '@koitea.mx', 540, 1215, { size: 92, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.025 }, t - 35.0, null);
    KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1300, { size: 54, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 35.6, null);
    KT.textIn(ctx, 'Promos & new drinks', 540, 1364, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 35.9, null);
    // ficha de información
    const I = KT.MENU.info, ia = seg(t, 36.2, 36.9), ib = seg(t, 36.6, 37.3);
    ctx.save(); ctx.globalAlpha *= Math.max(ia, ib); ctx.fillStyle = KT.rgba(C.ink, 0.14); ctx.fillRect(170, 1440, 740, 3); ctx.restore();
    if (ia > 0) { ctx.save(); ctx.globalAlpha *= ia; iconClock(ctx, 214, 1528, 26); ctx.restore(); KT.text(ctx, I.hours, 270, 1546, { size: 58, weight: 600, family: F.sans, color: C.ink, alpha: ia }); KT.text(ctx, 'Horario · Hours', 270, 1600, { size: 44, weight: 400, family: F.sans, color: C.en, alpha: ia }); }
    if (ib > 0) { ctx.save(); ctx.globalAlpha *= ib; iconPin(ctx, 214, 1700, 26); ctx.restore(); KT.text(ctx, I.address, 270, 1716, { size: 54, weight: 600, family: F.sans, color: C.ink, alpha: ib }); KT.text(ctx, I.city, 270, 1770, { size: 44, weight: 400, family: F.sans, color: C.en, alpha: ib }); }
  }
  // cinta roja inclinada que cruza la pantalla; la sección nueva queda a su izquierda
  const splitX = (T, t) => KT.lerp(-520, 1600, E.inOutCubic(seg(t, T - WD / 2, T + WD / 2)));
  function clipSide(ctx, xc, left) {
    const xt = xc + 960 * -SL, xb = xc - 960 * -SL; // línea inclinada como las letras (arriba más a la derecha)
    ctx.beginPath();
    if (left) { ctx.moveTo(-40, -40); ctx.lineTo(xt + 40 * -SL, -40); ctx.lineTo(xb - 40 * -SL, 1960); ctx.lineTo(-40, 1960); }
    else { ctx.moveTo(xt + 40 * -SL, -40); ctx.lineTo(1120 + 800, -40); ctx.lineTo(1120 + 800, 1960); ctx.lineTo(xb - 40 * -SL, 1960); }
    ctx.closePath(); ctx.clip();
  }
  function ribbon(ctx, xc) {
    const k = -SL, band = (w, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(xc - w + 1000 * k, -40); ctx.lineTo(xc + w + 1000 * k, -40); ctx.lineTo(xc + w - 1000 * k, 1960); ctx.lineTo(xc - w - 1000 * k, 1960); ctx.closePath(); ctx.fill(); };
    band(130, SIGN_RED); band(9, KT.rgba('#FFFFFF', 0.9)); ctx.save(); ctx.translate(-74, 0); band(4, KT.rgba('#FFFFFF', 0.5)); ctx.restore();
  }

  KT.register({
    id: 'v6', n: 6, name: 'Letrero', format: 'central', duration: L, cycles: 3, cycleLabel: 'Bebida',
    badge: 'Nueva', featured: true, sides: 'crema', labelNote: 'Horario y dirección por confirmar.',
    tagline: 'El letrero de la fachada en 3D, la bebida del momento, sabor y arte, y el QR con la información.',
    chapters: [
      { t: 0, label: 'Marca', note: 'La mascota se dibuja, las letras rojas del letrero se levantan una por una en 3D, un brillo las cruza y se enciende la caja de luz «BOBA SHOP».' },
      { t: 10, label: 'Bebida del momento', note: 'El vaso entra girando y se arma en 3D: perlas, bebida en capas, hielo, tapa sellada, popote y condensación, con su precio.' },
      { t: 24, label: 'Sabor y arte', note: '«sabor» se llena con la bebida de la vuelta y «arte» se pinta a pincel; el sello 鯉 firma.' },
      { t: 33, label: 'Síguenos', note: 'El letrero vuelve, QR a @koitea.mx, horario y dirección.' }
    ],
    info: {
      concept: 'Una versión que sale directo de la fachada. Las letras rojas de «KOI TEA», con su forma gruesa, redonda e inclinada y la A sin barra, se redibujaron a partir de la foto del letrero y se construyeron en 3D, como letras de canal: cara roja, costado blanco y sombra sobre la pared. Debajo se enciende la caja de luz de «BOBA SHOP». Después la bebida del momento se arma en 3D, la palabra «sabor» se llena con esa misma bebida y «arte» se pinta a pincel, y cierra con el QR, el horario y la dirección.',
      why: 'Lo primero que ve el cliente al llegar es el letrero; repetirlo adentro, en movimiento, une la fachada con la barra y hace la marca inconfundible. El orden de las cuatro secciones sigue lo que el cliente necesita en la fila: quién eres, qué pedir y cuánto cuesta, por qué es especial, y cómo seguirte o volver.',
      signature: 'Las letras del letrero se levantan una por una en 3D, con su sombra sobre la pared, y un brillo las cruza; entre secciones pasa una cinta roja con la misma inclinación de las letras.',
      specs: [['Formato', 'Pantalla central · 1080 × 1920'], ['Loop', '44 s × 3 bebidas = 132 s'], ['Secciones', '4 por vuelta, de 9 a 14 s'], ['Letrero', 'Letras redibujadas de la foto, en 3D'], ['Laterales', 'Menú en crema (o como hoy)'], ['Exportación', 'MP4 de 132 s o web']]
    },
    setup() { return { wall: KT.paper(1080, 1920, WALL, 61, 0.55) }; },
    draw(ctx, t, view, st) {
      const ci = view.cycle || 0, f = FEAT[ci], d = KT.drink(f.name);
      ctx.drawImage(st.wall, 0, 0, 1080, 1920);
      // luz cálida de arriba, como la de la fachada
      const lg = ctx.createRadialGradient(540, -200, 100, 540, -200, 1500); lg.addColorStop(0, 'rgba(255,246,230,0.55)'); lg.addColorStop(1, 'rgba(255,246,230,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, 1080, 1920);
      const scenes = [(c, tt) => sMarca(c, tt, st), (c, tt) => sBebida(c, tt, st, f, d), (c, tt) => sArte(c, tt, st, d), (c, tt) => sInfo(c, tt, st)];
      const endFade = 1 - seg(t, 43.0, 43.8);
      const wi = WIPES.findIndex(T => t > T - WD / 2 && t < T + WD / 2);
      if (wi >= 0) {
        const xc = splitX(WIPES[wi], t);
        ctx.save(); clipSide(ctx, xc, false); scenes[wi](ctx, t); ctx.restore();
        ctx.save(); clipSide(ctx, xc, true); scenes[wi + 1](ctx, t); ctx.restore();
        ribbon(ctx, xc);
        return;
      }
      const si = SCN.findIndex(([a, b]) => t >= a && t < b);
      if (si < 0) return;
      ctx.save(); if (si === 3) ctx.globalAlpha *= endFade; scenes[si](ctx, t); ctx.restore();
    }
  });
})();
