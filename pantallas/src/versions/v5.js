/* Versión 5 · Atardecer — las tres pantallas.
   Un friso continuo del Mar de Cortés, en línea como la playera del merch (olas, gaviotas, el Cerro de la Ballena y
   la mascota), corre por arriba de las tres pantallas. La luz cambia por vuelta, siempre de tarde: tarde clara,
   tarde dorada y atardecer. La Koi Tea, roja, naranja y ámbar, es "un atardecer en un vaso". En la tercera vuelta
   el sol se mete en un vaso de Koi Tea que sube del mar (7 s); la primera vuelta abre desde esa noche, con estrellas. */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 60, seg = KT.seg, CX = KT.X0.C, RX = KT.X0.R, WW = KT.WORLD3;
  const HZ = 236; // horizonte (igual en las tres pantallas)
  const PAL = [
    { name: 'Tarde clara', sky: ['#F6DFC0', '#FBEBD4'], sea: ['#C9C7B3', '#AEB2A0'], sun: '#F4C25A', sunY: 92, glow: 0.35 },
    { name: 'Tarde dorada', sky: ['#F3D2A6', '#FBE6CC'], sea: ['#D9A98B', '#B98A80'], sun: '#F2A142', sunY: 140, glow: 0.5 },
    { name: 'Atardecer', sky: ['#F6B048', '#E8603A'], sea: ['#C98B7A', '#8F6A78'], sun: '#F94E2B', sunY: 176, glow: 0.8 }
  ];
  const NIGHT = { sky: ['#3E3550', '#6B4A5E'], sea: ['#4E4352', '#3A3242'], sun: '#E04A2A', sunY: 176, glow: 0 };
  const M = KT.mixOklch;
  const mixPal = (a, b, k) => ({ sky: [M(a.sky[0], b.sky[0], k), M(a.sky[1], b.sky[1], k)], sea: [M(a.sea[0], b.sea[0], k), M(a.sea[1], b.sea[1], k)], sun: M(a.sun, b.sun, k), sunY: KT.lerp(a.sunY, b.sunY, k), glow: KT.lerp(a.glow, b.glow, k) });

  // estrellas tenues (solo de noche): posiciones fijas en el mundo, brillo que respira lento (sin parpadeos)
  const STARS = Array.from({ length: 46 }, (_, i) => ({ x: KT.hash(i * 7.1) * WW, y: 18 + KT.hash(i * 3.3 + 1) * 190, r: 1.6 + KT.hash(i * 5.7) * 2.2, ph: KT.hash(i * 9.1) * TAU }));
  function stars(ctx, x0, hz, a, t) {
    if (a <= 0) return;
    ctx.save(); ctx.fillStyle = '#FFF4DE';
    STARS.forEach(s => { if (s.x < x0 - 10 || s.x > x0 + 1090 || s.y > hz - 12) return; ctx.globalAlpha = a * (0.55 + 0.25 * Math.sin((TAU * 2 * t) / L + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  // gaviotas en «M» con cuerpo; cruzan de izquierda a derecha a ~70 px/s y pasan detrás del sol
  const GULLS = [{ y: 112, ph: 0, s: 1 }, { y: 70, ph: 0.37, s: 0.8 }, { y: 150, ph: 0.71, s: 0.9 }];
  function gull(ctx, x, y, s, t, i, col) {
    const f = Math.sin((TAU * 40 * t) / L + i) * 0.5;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-36, 6 + f * 8); ctx.quadraticCurveTo(-26, -12 - f * 10, -16, -12 - f * 12); ctx.quadraticCurveTo(-8, -10, 0, 2); ctx.quadraticCurveTo(8, -10, 16, -12 - f * 12); ctx.quadraticCurveTo(26, -12 - f * 10, 36, 6 + f * 8); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 3, 6, 3.4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function cerro(ctx, hz) { // Cerro de la Ballena con su faro, en la pantalla derecha
    const bx = RX + 540;
    ctx.save(); ctx.fillStyle = KT.rgba('#7A6A63', 0.35); ctx.strokeStyle = KT.rgba(C.ink, 0.85); ctx.lineWidth = 4.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 40, hz); ctx.bezierCurveTo(bx + 60, hz - 70, bx + 170, hz - 110, bx + 260, hz - 112); ctx.bezierCurveTo(bx + 340, hz - 110, bx + 420, hz - 60, bx + 520, hz - 10); ctx.lineTo(bx + 560, hz); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 250, hz - 112); ctx.lineTo(bx + 256, hz - 168); ctx.lineTo(bx + 276, hz - 168); ctx.lineTo(bx + 282, hz - 112); ctx.stroke();
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.rect(bx + 257, hz - 182, 18, 14); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // olas como las de la playera: pocas líneas largas, solo cerca del horizonte; van y vienen (periódicas)
  const WAVES = Array.from({ length: 16 }, (_, i) => ({ x: -120 + i * 245 + (KT.hash(i * 4.3) - 0.5) * 150, dy: [16, 34, 24, 52, 40, 70, 28, 60][i % 8] + (KT.hash(i * 2.9) - 0.5) * 10, len: 180 + KT.hash(i * 6.1) * 340, ph: KT.hash(i * 8.7) * TAU }));
  function waves(ctx, x0, hz, t, bottom, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
    WAVES.forEach(w => {
      const y = hz + w.dy; if (y > bottom - 8) return;
      const x = w.x + Math.sin((TAU * t) / L + w.ph) * 34; if (x + w.len < x0 - 20 || x > x0 + 1100) return;
      ctx.globalAlpha = 0.32 * (0.55 + 0.45 * Math.sin((TAU * 2 * t) / L + w.ph * 1.7));
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) { const u = k / 24, xx = x + w.len * u, yy = y + Math.sin(u * TAU * 1.5 + (TAU * 3 * t) / L + w.ph) * 3.5; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
    });
    ctx.restore();
  }
  function seaBand(ctx, x0, pal, t, bottom, hz, sun) {
    const sky = ctx.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, pal.sky[0]); sky.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(x0, 0, 1080, hz);
    const sea = ctx.createLinearGradient(0, hz, 0, Math.min(bottom, hz + 700)); sea.addColorStop(0, pal.sea[0]); sea.addColorStop(1, pal.sea[1]);
    ctx.fillStyle = sea; ctx.fillRect(x0, hz, 1080, bottom - hz);
  }
  function drawSun(ctx, x0, pal, hz, sun, t, bottom) {
    const sx = CX + 540, sy = sun.y;
    if (sun.a <= 0 || sx < x0 - 700 || sx > x0 + 1780) return;
    ctx.save(); ctx.globalAlpha = pal.glow * sun.a; ctx.drawImage(KT.glow(pal.sun, 360), sx - 360, sy - 360, 720, 720); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, 1080, hz); ctx.clip(); ctx.globalAlpha = sun.a;
    ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.arc(sx, sy, 64, 0, TAU); ctx.fill();
    ctx.strokeStyle = KT.rgba(C.ink, 0.8); ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
    // reflejo en el agua, corto y bajo el sol
    ctx.save(); ctx.globalAlpha = sun.a * KT.clamp((hz - sy + 64) / 80);
    for (let k = 0; k < 6; k++) { const yy = hz + 12 + k * 18; if (yy > bottom - 6) break; const w = 100 - k * 10 + Math.sin((TAU * 6 * t) / L + k) * 14; ctx.fillStyle = KT.rgba(KT.mix(pal.sun, '#FFFFFF', 0.4), 0.5 - k * 0.06); ctx.fillRect(sx - w / 2, yy, w, 4); }
    ctx.restore();
  }

  KT.register({
    id: 'v5', n: 5, name: 'Atardecer', format: 'triple', duration: L, cycles: 3, cycleLabel: 'Luz',
    takeover: { cycle: 2, t: 51.6, label: 'Ver la puesta de sol (toma de 7 s)' },
    tagline: 'Un friso del Mar de Cortés cruza las tres pantallas; la Koi Tea es un atardecer en un vaso.',
    chapters: [
      { t: 0, label: 'Hola, Rocky Point', note: 'Saludo bilingüe bajo el friso del mar. Las gaviotas cruzan de pantalla a pantalla y la mascota sorbe su boba.' },
      { t: 12, label: 'Un atardecer en un vaso', note: 'La Koi Tea forma sus capas rojo, naranja y ámbar, los mismos colores del cielo.' },
      { t: 26, label: 'Lo recomiendan', note: 'Durazno green tea con jelly de lichi, la combinación que recomienda una reseña.' },
      { t: 38, label: 'Comparte tu atardecer', note: 'QR a @koitea.mx · Rocky Point.' },
      { t: 50, label: 'Calma', note: 'Solo el mar. En la tercera vuelta, el sol se mete en un vaso de Koi Tea que sube del mar.' }
    ],
    info: {
      concept: 'Un friso continuo del Mar de Cortés corre por arriba de las tres pantallas, dibujado en línea como la playera blanca del merch: olas, gaviotas, el Cerro de la Ballena con su faro y la mascota, que sorbe su boba en la orilla. La luz cambia en cada vuelta, siempre de tarde (clara, dorada y atardecer), y puede seguir la hora real del local. La Koi Tea, roja abajo, naranja en medio y ámbar arriba, se presenta como lo que parece: un atardecer en un vaso.',
      why: 'Es la versión más local. Puerto Peñasco vive del mar y de sus atardeceres, y la bebida de la casa ya tiene esos colores. El friso le habla al turista de Arizona (“Hello from Koi Tea”) sin perder el tono de galería, y usa motivos que la marca ya imprimió en su playera. Los menús quedan en crema, fijos y legibles; el movimiento vive en la franja de arriba, donde además caen los reflejos.',
      signature: 'En la tercera vuelta, los menús se apartan, el horizonte baja y un vaso de Koi Tea sube del mar en la central: el sol se mete en él y lo llena con sus colores. La siguiente vuelta abre desde esa noche, con estrellas.',
      specs: [['Formato', '3 pantallas · lienzo de 3720 × 1920'], ['Loop', '60 s × 3 luces = 3 min'], ['Menú visible', '≈ 96% del tiempo'], ['Puesta de sol', '7 s cada 3 min'], ['Texto del menú', 'Nombres y precios 60 px, fijos'], ['Hora real', 'Opcional en modo web: atardecer a las 17:36 en noviembre']]
    },
    setup() { return { paper: KT.paper(1080, 1600, '#FBF3E8', 51, 0.7), paperC: KT.paper(900, 1400, '#FBF3E8', 52, 0.7) }; },
    draw(ctx, t, view, st) {
      const cyc = view.cycle || 0, x0 = view.x0;
      // la toma (vuelta 3): primero se retira el texto, luego baja el horizonte y sube el vaso; al final todo regresa
      const textOff = cyc === 2 ? KT.env(t, 51.8, 59.6, 0.6, 0.6) : 0;
      const take = cyc === 2 ? KT.env(t, 52.4, 59.0, 1.0, 1.0) : 0;
      // luz de la vuelta: funde desde la anterior; la primera abre desde la noche con estrellas
      const k0 = E.inOutSine(seg(t, 0, 4));
      let pal = mixPal(cyc === 0 ? NIGHT : PAL[cyc - 1], PAL[cyc], k0);
      const sun = { y: cyc === 0 ? PAL[0].sunY : pal.sunY, a: cyc === 0 ? k0 : 1 };
      let starA = cyc === 0 ? 1 - k0 : 0, hz = HZ, cupRise = 0, cupFill = 0;
      if (cyc === 2 && t > 52) {
        const kH = E.inOutCubic(KT.env(t, 52.4, 59.0, 1.8, 1.2));
        hz = HZ + 700 * kH;
        cupRise = E.inOutCubic(KT.env(t, 53.8, 58.6, 1.6, 1.0));
        cupFill = E.inOutSine(seg(t, 55.6, 57.4));
        // el sol sube sobre el vaso y luego baja dentro de él
        const rel = KT.lerp(PAL[2].sunY - HZ, -770, E.inOutSine(seg(t, 52.4, 54.6))) + 520 * E.inOutSine(seg(t, 55.4, 57.4));
        sun.y = hz + rel; sun.a = 1 - seg(t, 57.2, 57.6);
        pal = mixPal(pal, NIGHT, E.inOutSine(seg(t, 56.6, 59.6)));
        starA = seg(t, 58.2, 59.9);
      }
      const band = 330, bottom = KT.lerp(band, 1920, E.inOutCubic(take));
      const lineCol = KT.mixOklch(C.ink, '#FBF3E8', KT.clamp((1 - KT.rgb(pal.sea[0])[1] / 255 - 0.45) * 3));
      // fondo crema bajo el friso
      ctx.fillStyle = '#FBF3E8'; ctx.fillRect(x0, 0, 1080, 1920);
      if (view.slot !== 'C') ctx.drawImage(st.paper, x0, band, 1080, 1600);
      const seaBottom = view.slot === 'C' ? 1920 : Math.max(bottom, hz + 60);
      seaBand(ctx, x0, pal, t, seaBottom, hz);
      stars(ctx, x0, hz, starA, t);
      // gaviotas (detrás del sol)
      GULLS.forEach((g, i) => {
        const x = -200 + ((((t / L) + g.ph) % 1) * (WW + 400)), y = g.y + Math.sin((TAU * 3 * t) / L + i) * 10;
        if (x > x0 - 80 && x < x0 + 1160 && y < hz - 30) gull(ctx, x, y, g.s, t, i, KT.rgba(lineCol, 0.85));
      });
      drawSun(ctx, x0, pal, hz, sun, t, seaBottom);
      waves(ctx, x0, hz, t, seaBottom, lineCol);
      if (x0 === RX) cerro(ctx, hz);
      // la mascota en la orilla de la pantalla izquierda, sorbe su boba cada vuelta
      if (x0 === 0) {
        const life = KT.mascotLife(t, L, 2.1), sip = Math.max(seg(t, 8, 9.4), seg(t, 30, 31.4)), s = KT.clamp(sip) > 0 && sip < 1 ? sip : 0;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, hz + 40); ctx.clip();
        KT.mascot(ctx, 190, hz - 58 + life.bob * 0.3, 230, { blink: life.blink, finL: life.finL, finR: life.finR, whisk: life.whisk, dorsal: life.dorsal, sip: s, lw: 9, tea: KT.mix(C.milk, '#F07A2E', 0.5), teaLayers: KT.drink('Koi Tea').layers, topType: 'jelly' });
        ctx.restore();
      }
      // línea del horizonte
      ctx.strokeStyle = KT.rgba(C.ink, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, hz); ctx.lineTo(x0 + 1080, hz); ctx.stroke();
      // el vaso de Koi Tea sube del mar en la central y el sol se mete en él
      if (view.slot === 'C' && cupRise > 0) {
        const H = 620, by = hz + H * (1 - cupRise) + 6;
        ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, 1080, hz + 4); ctx.clip();
        KT.cup(ctx, CX + 540, by, H, { drink: KT.drink('Koi Tea'), fill: 0.25 + 0.75 * cupFill, drop: cupFill, film: false, ice: true, floorShadow: false, wave: (TAU * 20 * t) / L, seed: 31 });
        ctx.restore();
      }
      // borde inferior del friso
      if (view.slot !== 'C' && take < 1) { ctx.fillStyle = KT.rgba(C.ink, 0.85 * (1 - take)); ctx.fillRect(x0, band - 2, 1080, 4); }

      // ---- laterales: menú fijo bajo el friso ----
      if (view.slot !== 'C') {
        const ba = 1 - textOff;
        if (ba > 0) {
          ctx.save(); ctx.translate(x0, 0);
          let hi = null;
          if (view.slot === 'L') { const k1 = KT.env(t, 13, 25.6, 1, 1), k2 = KT.env(t, 27, 37.6, 1, 1); hi = k1 > 0 ? { name: 'Koi Tea', k: k1 } : (k2 > 0 ? { name: 'Durazno Green Tea', k: k2 } : null); }
          KT.board(ctx, view.slot, { top: band + 40, hi, alpha: ba, scale: Math.min(1, (1880 - band - 40) / KT.boardHeight(view.slot)) });
          ctx.restore();
        }
        return;
      }

      // ---- central ----
      ctx.save(); ctx.translate(x0, 0);
      const card = (a, x, y, w, h) => KT.card(ctx, x, y, w, h, a, { paper: st.paperC, drop: [8, 12, 0.14, '#3A2A20'] });
      const sc = a => a * (1 - textOff);
      // 1 · Hola, Rocky Point
      const a1 = sc(KT.env(t, 0.4, 11.6, 1, 0.9));
      if (a1 > 0) {
        card(a1, 110, 560, 860, 860);
        const out = t > 11 ? t - 11 : null;
        KT.textIn(ctx, 'Hola,', 540, 770, { size: 118, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.05 }, t - 1, out);
        KT.textIn(ctx, 'Rocky Point', 540, 900, { size: 118, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.04 }, t - 1.5, out);
        KT.textIn(ctx, 'Hello from Koi Tea', 540, 990, { size: 52, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 2.4, out);
        KT.textIn(ctx, 'KOI TEA', 540, 1180, { size: 96, weight: 600, family: F.logo, color: C.ink, align: 'center', ls: 16, stagger: 0.05 }, t - 3, out);
        KT.textIn(ctx, 'Boba shop · Puerto Peñasco', 540, 1260, { size: 50, weight: 500, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 3.6, out);
      }
      // 2 · Un atardecer en un vaso
      const a2 = sc(KT.env(t, 12.3, 25.6, 1, 1));
      if (a2 > 0) {
        card(a2, 90, 440, 900, 1360);
        const out = t > 25 ? t - 25 : null, d = KT.drink('Koi Tea');
        KT.textIn(ctx, 'Un atardecer', 540, 610, { size: 120, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 12.8, out);
        KT.textIn(ctx, 'en un vaso', 540, 732, { size: 120, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.04 }, t - 13.2, out);
        KT.textIn(ctx, 'A sunset in a cup', 540, 818, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 13.9, out);
        const p = seg(t, 14.2, 21);
        ctx.save(); ctx.globalAlpha *= a2;
        KT.cup(ctx, 370, 1700, 720, { drink: d, fill: KT.seg(p, 0, 0.6), drop: KT.seg(p, 0.55, 0.95), ice: true, wave: (TAU * 24 * t) / L, seed: 21 });
        ctx.restore();
        const pa = KT.clamp((t - 19.4) / 0.8) * a2;
        KT.text(ctx, 'Koi Tea', 660, 1130, { size: 72, weight: 600, family: F.sans, color: C.ink, alpha: pa });
        KT.priceBlock(ctx, 660, 1360, d.p, { alpha: pa, rule: E.outCubic(KT.clamp((t - 19.4) / 0.8)) });
      }
      // 3 · Lo recomiendan (cita de una reseña, sin estrellas)
      const a3 = sc(KT.env(t, 26.3, 37.6, 1, 1));
      if (a3 > 0) {
        card(a3, 90, 470, 900, 1300);
        const out = t > 37 ? t - 37 : null, d = KT.drink('Durazno Green Tea');
        KT.textIn(ctx, 'LO RECOMIENDAN', 540, 600, { size: 46, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 4, stagger: 0.015 }, t - 26.8, out);
        const Q = KT.fitLines(ctx, '«Durazno green tea con jelly de lichi»', { size: 96, style: 'italic', family: F.serif }, 740, 80);
        let qy = 730; Q.lines.forEach((ln, i) => { KT.textIn(ctx, ln, 540, qy, Object.assign({ color: C.ink, align: 'center', mode: 'mask', stagger: 0.025 }, Q.o), t - 27.4 - i * 0.3, out); qy += Q.o.size * 1.08; });
        qy += 30 - Q.o.size * 1.08;
        KT.textIn(ctx, '— reseña de cliente en Google Maps', 540, qy + 40, { size: 40, weight: 400, family: F.sans, color: C.walnut, align: 'center', mode: 'fade' }, t - 28.4, out);
        KT.textIn(ctx, 'Peach green tea with lychee jelly', 540, qy + 112, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 28.7, out);
        ctx.save(); ctx.globalAlpha *= a3;
        KT.cup(ctx, 370, 1720, 560, { drink: d, top: { type: 'jelly', color: '#F2ECE2' }, fill: seg(t, 28.6, 31.2), drop: seg(t, 30.4, 33), ice: true, wave: (TAU * 24 * t) / L, seed: 22 });
        ctx.restore();
        const pa = KT.clamp((t - 31.4) / 0.8) * a3;
        KT.priceBlock(ctx, 660, 1430, d.p, { alpha: pa, rule: E.outCubic(KT.clamp((t - 31.4) / 0.8)) });
      }
      // 4 · Comparte tu atardecer
      const a4 = sc(KT.env(t, 38.3, 49.6, 1, 1));
      if (a4 > 0) {
        card(a4, 150, 470, 780, 1240);
        const out = t > 49 ? t - 49 : null;
        KT.textIn(ctx, 'Comparte', 540, 630, { size: 110, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 38.8, out);
        KT.textIn(ctx, 'tu atardecer', 540, 748, { size: 110, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.04 }, t - 39.2, out);
        KT.textIn(ctx, 'Share your sunset', 540, 830, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 39.8, out);
        ctx.save(); ctx.globalAlpha *= KT.clamp((t - 40.2) / 0.6) * a4; KT.qr(ctx, 540 - 165, 890, 330, { round: 0.32, radius: 24, light: '#FFFCF6', reveal: E.outCubic(seg(t, 40.2, 41.6)) }); ctx.restore();
        KT.textIn(ctx, '@koitea.mx', 540, 1350, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.03 }, t - 41, out);
        KT.textIn(ctx, 'Rocky Point · Puerto Peñasco', 540, 1434, { size: 50, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 41.6, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1530, { size: 52, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 42, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1594, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 42.3, out);
      }
      // 5 · Calma / puesta de sol (vuelta 3)
      if (t > 50) {
        const a5 = KT.env(t, 50.4, 59.6, 1.2, 1.0);
        const dark = cyc === 2 && t > 53;
        KT.textIn(ctx, 'KOI TEA', 540, 1380, { size: 110, weight: 600, family: F.logo, color: dark ? '#FBF3E8' : C.ink, align: 'center', ls: 18, stagger: 0.06, alpha: a5 }, t - 50.8, t > 59 ? t - 59 : null);
        KT.textIn(ctx, 'Rocky Point, MX', 540, 1466, { size: 52, weight: 500, family: F.sans, color: dark ? '#FBF3E8' : C.ink, align: 'center', mode: 'fade', ls: 4, alpha: a5 }, t - 51.4, t > 59 ? t - 59 : null);
        KT.hanko(ctx, 540, 1600, 84, '鯉', { alpha: a5 * KT.clamp((t - 52) / 0.5), rot: -0.05 });
      }
      ctx.restore();
    }
  });
})();
