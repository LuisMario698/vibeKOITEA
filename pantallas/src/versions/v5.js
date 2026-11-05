/* Versión 5 · Atardecer — las tres pantallas.
   Un friso continuo del Mar de Cortés, en línea como la playera del merch (olas, gaviotas, el Cerro de la Ballena),
   corre por arriba de las tres pantallas. La luz cambia por vuelta: mediodía, tarde y atardecer. La Koi Tea, roja,
   naranja y ámbar, es "un atardecer en un vaso". En la tercera vuelta el sol se mete en el mar en las tres pantallas (7 s). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 60, seg = KT.seg, CX = KT.X0.C, RX = KT.X0.R, WW = KT.WORLD3;
  const HZ = 236; // horizonte (igual en las tres pantallas)
  const PAL = [
    { name: 'Mediodía', sky: ['#F4E7D3', '#FBF4EA'], sea: ['#B9D3CE', '#9CC1BC'], sun: '#F4C25A', sunY: 92, glow: 0.35 },
    { name: 'Tarde', sky: ['#F3D7AE', '#FBEBD4'], sea: ['#A9C6C1', '#8BB3AE'], sun: '#F2A142', sunY: 140, glow: 0.5 },
    { name: 'Atardecer', sky: ['#F6B048', '#E8603A'], sea: ['#C98B7A', '#8F6A78'], sun: '#F94E2B', sunY: 176, glow: 0.8 }
  ];
  const mixPal = (a, b, k) => ({ sky: [KT.mix(a.sky[0], b.sky[0], k), KT.mix(a.sky[1], b.sky[1], k)], sea: [KT.mix(a.sea[0], b.sea[0], k), KT.mix(a.sea[1], b.sea[1], k)], sun: KT.mix(a.sun, b.sun, k), sunY: KT.lerp(a.sunY, b.sunY, k), glow: KT.lerp(a.glow, b.glow, k) });
  const NIGHT = { sky: ['#5B4757', '#B8654C'], sea: ['#6E5A68', '#4E4352'], sun: '#E04A2A', sunY: 262, glow: 0.4 };

  // gaviotas: cruzan de izquierda a derecha a ~70 px/s (pasan detrás de los huecos sin detenerse)
  const GULLS = [{ y: 120, ph: 0, s: 1 }, { y: 82, ph: 0.37, s: 0.8 }, { y: 150, ph: 0.71, s: 0.9 }];
  function gull(ctx, x, y, s, t, i) {
    const flap = Math.sin((TAU * 40 * t) / L + i) * 0.35;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = KT.rgba(C.ink, 0.85); ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-34, -6 - flap * 22); ctx.quadraticCurveTo(-16, -18 - flap * 10, 0, 0); ctx.quadraticCurveTo(16, -18 - flap * 10, 34, -6 - flap * 22); ctx.stroke();
    ctx.restore();
  }
  function cerro(ctx, HZ) { // Cerro de la Ballena con su faro, en la pantalla derecha
    const bx = RX + 540;
    ctx.save(); ctx.fillStyle = KT.rgba('#7A6A63', 0.35); ctx.strokeStyle = KT.rgba(C.ink, 0.85); ctx.lineWidth = 4.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 40, HZ); ctx.bezierCurveTo(bx + 60, HZ - 70, bx + 170, HZ - 110, bx + 260, HZ - 112); ctx.bezierCurveTo(bx + 340, HZ - 110, bx + 420, HZ - 60, bx + 520, HZ - 10); ctx.lineTo(bx + 560, HZ); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 250, HZ - 112); ctx.lineTo(bx + 256, HZ - 168); ctx.lineTo(bx + 276, HZ - 168); ctx.lineTo(bx + 282, HZ - 112); ctx.stroke();
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.rect(bx + 257, HZ - 182, 18, 14); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function seaBand(ctx, x0, pal, t, bottom, HZ, sunY) {
    const sky = ctx.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, pal.sky[0]); sky.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(x0, 0, 1080, HZ);
    const sea = ctx.createLinearGradient(0, HZ, 0, bottom); sea.addColorStop(0, pal.sea[0]); sea.addColorStop(1, pal.sea[1]);
    ctx.fillStyle = sea; ctx.fillRect(x0, HZ, 1080, bottom - HZ);
    // sol (en la central) y su brillo sobre el agua
    const sx = CX + 540, sy = sunY;
    if (sx > x0 - 700 && sx < x0 + 1780) {
      ctx.save(); ctx.globalAlpha = pal.glow; ctx.drawImage(KT.glow(pal.sun, 360), sx - 360, sy - 360, 720, 720); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, 1080, HZ); ctx.clip();
      ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.arc(sx, sy, 64, 0, TAU); ctx.fill();
      ctx.strokeStyle = KT.rgba(C.ink, 0.8); ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
      for (let k = 0; k < 9; k++) { const yy = HZ + 14 + k * 26; if (yy > bottom - 6) break; const w = 110 - k * 6 + Math.sin((TAU * 6 * t) / L + k) * 18; ctx.fillStyle = KT.rgba(KT.mix(pal.sun, '#FFFFFF', 0.4), 0.55 - k * 0.04); ctx.fillRect(sx - w / 2, yy, w, 5); }
    }
    // olas en línea (se desplazan lento, periódicas)
    ctx.save(); ctx.beginPath(); ctx.rect(x0, HZ, 1080, bottom - HZ); ctx.clip();
    ctx.strokeStyle = KT.rgba(C.ink, 0.7); ctx.lineCap = 'round';
    const rows = Math.max(1, Math.floor((bottom - HZ) / 40));
    for (let r = 0; r < rows; r++) {
      const yy = HZ + 22 + r * 40 + r * r * 3, sp = 90 + r * 30, off = ((TAU * (r % 2 ? 1 : -1) * t) / L) * 2;
      ctx.lineWidth = 2.5 + r * 0.5; ctx.globalAlpha = 0.25 + Math.min(0.5, r * 0.08);
      ctx.beginPath();
      for (let x = Math.floor((x0 - 200) / sp) * sp; x < x0 + 1280; x += sp) { const xx = x + ((off * sp) / TAU) % sp + (r % 2) * sp * 0.5; ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + sp * 0.25, yy - 10 - r, xx + sp * 0.5, yy); }
      ctx.stroke();
    }
    ctx.restore();
    // línea del horizonte
    ctx.strokeStyle = KT.rgba(C.ink, 0.85); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, HZ); ctx.lineTo(x0 + 1080, HZ); ctx.stroke();
  }

  KT.register({
    id: 'v5', n: 5, name: 'Atardecer', format: 'triple', duration: L, cycles: 3, cycleLabel: 'Luz',
    takeover: { cycle: 2, t: 51.6, label: 'Ver la puesta de sol (toma de 7 s)' },
    tagline: 'Un friso del Mar de Cortés cruza las tres pantallas; la Koi Tea es un atardecer en un vaso.',
    chapters: [
      { t: 0, label: 'Hola, Rocky Point', note: 'Saludo bilingüe bajo el friso del mar. Las gaviotas cruzan de pantalla a pantalla.' },
      { t: 12, label: 'Un atardecer en un vaso', note: 'La Koi Tea forma sus capas rojo, naranja y ámbar, los mismos colores del cielo.' },
      { t: 26, label: 'Recomendado en Google', note: 'Durazno green tea con jelly de lichi, la combinación que recomienda una reseña.' },
      { t: 38, label: 'Comparte tu atardecer', note: 'QR a @koitea.mx · Rocky Point.' },
      { t: 50, label: 'Calma', note: 'Solo el mar. En la tercera vuelta, el sol se mete en las tres pantallas.' }
    ],
    info: {
      concept: 'Un friso continuo del Mar de Cortés corre por arriba de las tres pantallas, dibujado en línea como la playera blanca del merch: olas, gaviotas y el Cerro de la Ballena con su faro. La luz cambia en cada vuelta (mediodía, tarde y atardecer) y puede seguir la hora real del local. La Koi Tea, roja abajo, naranja en medio y ámbar arriba, se presenta como lo que parece: un atardecer en un vaso.',
      why: 'Es la versión más local. Puerto Peñasco vive del mar y de sus atardeceres, y la bebida de la casa ya tiene esos colores. El friso le habla al turista de Arizona (“Hello, Rocky Point”) sin perder el tono de galería, y usa motivos que la marca ya imprimió en su playera. Los menús quedan en crema, fijos y legibles; el movimiento vive en la franja de arriba, donde además caen los reflejos.',
      signature: 'En la tercera vuelta, los menús se apartan y el sol se mete en el mar a lo largo de las tres pantallas; la central lo cierra con la Koi Tea.',
      specs: [['Formato', '3 pantallas · lienzo de 3720 × 1920'], ['Loop', '60 s × 3 luces = 3 min'], ['Menú visible', '≈ 96% del tiempo'], ['Puesta de sol', '7 s cada 3 min'], ['Texto del menú', 'Nombres y precios 60 px, fijos'], ['Hora real', 'Opcional en modo web: atardecer a las 17:36 en noviembre']]
    },
    setup() { return { paper: KT.paper(1080, 1600, '#FBF3E8', 51, 0.7) }; },
    draw(ctx, t, view, st) {
      const cyc = view.cycle || 0, x0 = view.x0;
      // la toma: primero se retira el texto, luego crece el mar; al final el mar se recoge y después vuelve el texto
      const take = cyc === 2 ? KT.env(t, 52.4, 59.0, 1.0, 1.0) : 0;
      const textOff = cyc === 2 ? KT.env(t, 51.8, 59.6, 0.6, 0.6) : 0;
      // luz: cada vuelta empieza fundiendo desde la anterior (amanecer en la primera)
      const prev = cyc === 0 ? NIGHT : PAL[cyc - 1];
      let pal = mixPal(prev, PAL[cyc], E.inOutSine(seg(t, 0, 4)));
      let hz = HZ, sunRel = pal.sunY - HZ;
      if (cyc === 2) {
        const kSet = E.inOutSine(seg(t, 54.2, 58.4));
        pal = mixPal(pal, NIGHT, E.inOutSine(seg(t, 53, 58.6)));
        hz = HZ + 700 * E.inOutCubic(KT.env(t, 52.4, 59.0, 1.8, 1.0));
        if (t > 52) sunRel = KT.lerp(PAL[2].sunY - HZ, -330, E.inOutSine(seg(t, 52, 54))) + 370 * kSet;
        if (t > 58.4) sunRel = Math.max(sunRel, NIGHT.sunY - HZ);
      }
      const band = 330, bottom = KT.lerp(band, 1920, E.inOutCubic(take));
      // fondo crema bajo el friso
      ctx.fillStyle = '#FBF3E8'; ctx.fillRect(x0, 0, 1080, 1920);
      if (view.slot !== 'C') ctx.drawImage(st.paper, x0, band, 1080, 1600);
      seaBand(ctx, x0, pal, t, view.slot === 'C' ? 1920 : Math.max(bottom, hz + 60), hz, hz + sunRel);
      if (x0 === RX) cerro(ctx, hz);
      // gaviotas
      GULLS.forEach((g, i) => {
        const x = -200 + ((((t / L) + g.ph) % 1) * (WW + 400)), y = g.y + Math.sin((TAU * 3 * t) / L + i) * 10;
        if (x > x0 - 80 && x < x0 + 1160) gull(ctx, x, y, g.s, t, i);
      });
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
      const card = (a, x, y, w, h) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(40,30,30,0.16)'; ctx.beginPath(); KT.rr(ctx, x + 10, y + 16, w, h, 28); ctx.fill(); ctx.fillStyle = '#FBF3E8'; ctx.beginPath(); KT.rr(ctx, x, y, w, h, 28); ctx.fill(); ctx.strokeStyle = KT.rgba(C.ink, 0.2); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); };
      const sc = a => a * (1 - textOff);
      // 1 · Hola, Rocky Point
      const a1 = sc(KT.env(t, 0.4, 11.6, 1, 0.9));
      if (a1 > 0) {
        card(a1, 110, 560, 860, 860);
        const out = t > 11 ? t - 11 : null;
        KT.textIn(ctx, 'Hola,', 540, 790, { size: 150, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.05 }, t - 1, out);
        KT.textIn(ctx, 'Rocky Point', 540, 940, { size: 150, weight: 700, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.04 }, t - 1.5, out);
        KT.textIn(ctx, 'Hello from Koi Tea', 540, 1040, { size: 52, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 2.4, out);
        KT.textIn(ctx, 'KOI TEA', 540, 1230, { size: 96, weight: 800, family: F.round, color: C.ink, align: 'center', ls: 16, stagger: 0.05 }, t - 3, out);
        KT.textIn(ctx, 'Boba shop · Puerto Peñasco', 540, 1310, { size: 50, weight: 500, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 3.6, out);
      }
      // 2 · Un atardecer en un vaso
      const a2 = sc(KT.env(t, 12.3, 25.6, 1, 1));
      if (a2 > 0) {
        card(a2, 90, 440, 900, 1360);
        const out = t > 25 ? t - 25 : null, d = KT.drink('Koi Tea');
        KT.textIn(ctx, 'Un atardecer', 540, 600, { size: 128, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 12.8, out);
        KT.textIn(ctx, 'en un vaso', 540, 724, { size: 128, weight: 700, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.04 }, t - 13.2, out);
        KT.textIn(ctx, 'A sunset in a cup', 540, 810, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 13.9, out);
        const p = seg(t, 14.2, 21), a = KT.lerp(0.95, 0.3, E.inOutCubic(KT.seg(p, 0.35, 1))), b = KT.lerp(1, 0.6, E.inOutCubic(KT.seg(p, 0.35, 1)));
        ctx.save(); ctx.globalAlpha *= a2;
        KT.cup(ctx, 400, 1700, 760, { drink: Object.assign({}, d, { layers: [[0, '#C81E3A'], [Math.min(a, 0.94), '#D8283F'], [Math.min(b, 0.97), '#F07A2E'], [1, '#F6B048']] }), fill: KT.seg(p, 0, 0.45), drop: KT.seg(p, 0.5, 0.9), ice: true, sweat: 0.7, wave: (TAU * 24 * t) / L, seed: 21 });
        ctx.restore();
        const pa = KT.clamp((t - 19.4) / 0.8) * a2;
        KT.text(ctx, 'Koi Tea', 790, 1200, { size: 72, weight: 600, family: F.sans, color: C.ink, align: 'center', alpha: pa });
        KT.text(ctx, String(d.p), 790, 1360, { size: 150, weight: 600, family: F.sans, color: C.ink, align: 'center', alpha: pa });
        KT.text(ctx, 'MXN', 790, 1424, { size: 46, weight: 600, family: F.sans, color: C.ink, align: 'center', ls: 4, alpha: pa });
        KT.text(ctx, '≈ ' + KT.money(d.p, 'usd'), 790, 1494, { size: 46, weight: 500, family: F.sans, color: C.en, align: 'center', alpha: pa });
      }
      // 3 · Recomendado en Google
      const a3 = sc(KT.env(t, 26.3, 37.6, 1, 1));
      if (a3 > 0) {
        card(a3, 90, 470, 900, 1300);
        const out = t > 37 ? t - 37 : null, d = KT.drink('Durazno Green Tea');
        KT.textIn(ctx, 'RECOMENDADO EN GOOGLE', 540, 600, { size: 46, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 4, stagger: 0.015 }, t - 26.8, out);
        const stars = KT.clamp((t - 27.2) / 0.8) * (out != null ? 1 - KT.clamp(out / 0.6) : 1);
        for (let k = 0; k < 5; k++) { ctx.save(); ctx.globalAlpha *= stars; ctx.translate(380 + k * 80, 680); ctx.fillStyle = C.gold; ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 14 : 32, an = -Math.PI / 2 + (j * Math.PI) / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }
        KT.textIn(ctx, 'Durazno', 540, 830, { size: 124, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.03 }, t - 27.6, out);
        KT.textIn(ctx, 'Green Tea', 540, 950, { size: 124, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.03 }, t - 27.9, out);
        KT.textIn(ctx, 'con jelly de lichi', 540, 1040, { size: 58, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 28.4, out);
        KT.textIn(ctx, 'Peach green tea, lychee jelly', 540, 1104, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 28.7, out);
        ctx.save(); ctx.globalAlpha *= a3;
        KT.cup(ctx, 400, 1720, 560, { drink: d, top: { type: 'jelly', color: '#F2ECE2' }, fill: seg(t, 28.6, 31.2), drop: seg(t, 30.4, 33), ice: true, sweat: 0.6, wave: (TAU * 24 * t) / L, seed: 22 });
        ctx.restore();
        const pa = KT.clamp((t - 31.4) / 0.8) * a3;
        KT.text(ctx, String(d.p), 790, 1450, { size: 150, weight: 600, family: F.sans, color: C.ink, align: 'center', alpha: pa });
        KT.text(ctx, 'MXN', 790, 1514, { size: 46, weight: 600, family: F.sans, color: C.ink, align: 'center', ls: 4, alpha: pa });
        KT.text(ctx, '≈ ' + KT.money(d.p, 'usd'), 790, 1584, { size: 46, weight: 500, family: F.sans, color: C.en, align: 'center', alpha: pa });
      }
      // 4 · Comparte tu atardecer
      const a4 = sc(KT.env(t, 38.3, 49.6, 1, 1));
      if (a4 > 0) {
        card(a4, 150, 470, 780, 1240);
        const out = t > 49 ? t - 49 : null;
        KT.textIn(ctx, 'Comparte', 540, 640, { size: 132, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04 }, t - 38.8, out);
        KT.textIn(ctx, 'tu atardecer', 540, 766, { size: 132, weight: 700, style: 'italic', family: F.serif, color: C.red, align: 'center', mode: 'mask', stagger: 0.04 }, t - 39.2, out);
        KT.textIn(ctx, 'Share your sunset', 540, 850, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 39.8, out);
        ctx.save(); ctx.globalAlpha *= KT.clamp((t - 40.2) / 0.6) * a4; KT.qr(ctx, 540 - 165, 910, 330, { round: 0.32, radius: 24, light: '#FFFCF6', reveal: E.outCubic(seg(t, 40.2, 41.6)) }); ctx.restore();
        KT.textIn(ctx, '@koitea.mx', 540, 1380, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', stagger: 0.03 }, t - 41, out);
        KT.textIn(ctx, 'Rocky Point · Puerto Peñasco', 540, 1466, { size: 50, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 41.6, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1560, { size: 52, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade' }, t - 42, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1622, { size: 46, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade' }, t - 42.3, out);
      }
      // 5 · Calma / puesta de sol (vuelta 3)
      if (t > 50) {
        const a5 = KT.env(t, 50.4, 59.6, 1.2, 1.0);
        const dark = cyc === 2 && t > 53;
        KT.textIn(ctx, 'KOI TEA', 540, 1380, { size: 110, weight: 800, family: F.round, color: dark ? '#FBF3E8' : C.ink, align: 'center', ls: 18, stagger: 0.06, alpha: a5 }, t - 50.8, t > 59 ? t - 59 : null);
        KT.textIn(ctx, 'Rocky Point, MX', 540, 1466, { size: 52, weight: 500, family: F.sans, color: dark ? '#FBF3E8' : C.ink, align: 'center', mode: 'fade', ls: 4, alpha: a5 }, t - 51.4, t > 59 ? t - 59 : null);
        KT.hanko(ctx, 540, 1600, 84, '鯉', { alpha: a5 * KT.clamp((t - 52) / 0.5), rot: -0.05 });
      }
      ctx.restore();
    }
  });
})();
