/* Versión 1 · Koi vivo — solo pantalla central.
   La mascota del logo se dibuja con tinta, toma su boba y presenta la bebida del momento; cierra con el QR a Instagram.
   Loop de 36 s; cada vuelta destaca una bebida distinta (3 vueltas). */
(function () {
  'use strict';
  const KT = window.KT, C = KT.C, F = KT.F, E = KT.E, TAU = Math.PI * 2;
  const L = 36;
  const FEAT = [
    { name: 'Taro Milk Tea', es: 'Cremoso, con taro', en: 'Creamy taro' },
    { name: 'Koi Tea', es: 'La bebida de la casa', en: 'Our house signature', ice: true },
    { name: 'Brown Sugar Milk Tea', es: 'Azúcar morena y tapioca', en: 'Brown sugar & tapioca' }
  ];
  const seg = KT.seg, ph = KT.ph;

  // posición/tamaño de la mascota a lo largo del loop
  function mascotPose(t) {
    const A = { x: 540, y: 790, s: 820 }, B = { x: 540, y: 330, s: 410 }, Cc = { x: 540, y: 560, s: 600 };
    const lerp = (p, q, k) => ({ x: KT.lerp(p.x, q.x, k), y: KT.lerp(p.y, q.y, k), s: KT.lerp(p.s, q.s, k) });
    if (t < 12.2) return A;
    if (t < 13.6) return lerp(A, B, E.silk(seg(t, 12.2, 13.6)));
    if (t < 26.2) return B;
    if (t < 27.6) return lerp(B, Cc, E.silk(seg(t, 26.2, 27.6)));
    return Cc;
  }

  function waves(ctx, t, y0, alpha) {
    ctx.save(); ctx.strokeStyle = KT.rgba(C.ink, alpha); ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const y = y0 + k * 34, phs = (TAU * 2 * t) / L + k * 0.9;
      ctx.lineWidth = 3.2 - k * 0.6; ctx.beginPath();
      for (let x = 60; x <= 1020; x += 12) { const yy = y + Math.sin(x / 120 + phs) * 10 + Math.sin(x / 47 - phs * 2) * 3; x === 60 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    ctx.restore();
  }

  // nombre largo en dos renglones (la cursiva de alto contraste solo a ≥ 120 px)
  function nameLines(ctx, name, o, maxW) {
    if (KT.measure(ctx, name, o) <= maxW) return [name];
    const w = name.split(' '); let best = [name], bd = 1e9;
    for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '); const d = Math.max(KT.measure(ctx, a, o), KT.measure(ctx, b, o)); if (d < bd) { bd = d; best = [a, b]; } }
    return best;
  }

  function priceBadge(ctx, x, y, mxn, p) {
    if (p <= 0) return;
    const s = E.outBack(KT.clamp(p)), r = 150 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06 + (1 - s) * 0.4);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = KT.rgba('#FFFFFF', 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r - 14, 0, TAU); ctx.stroke();
    if (s > 0.6) {
      const a = KT.clamp((s - 0.6) / 0.4);
      KT.text(ctx, String(mxn), 0, 30, { size: 132, weight: 600, family: F.sans, color: '#FFFFFF', align: 'center', alpha: a });
      KT.text(ctx, 'MXN', 0, 86, { size: 40, weight: 600, family: F.sans, color: '#FFFFFF', align: 'center', ls: 4, alpha: a });
    }
    ctx.restore();
  }

  KT.register({
    id: 'v1', n: 1, name: 'Koi vivo', pick: true, format: 'central', duration: L, cycles: 3, cycleLabel: 'Bebida',
    tagline: 'La mascota se dibuja, toma su boba y presenta la bebida del momento.',
    chapters: [
      { t: 0, label: 'Se dibuja', note: 'El koi del logo aparece trazo a trazo y toma color.' },
      { t: 6.2, label: 'Toma su boba', note: 'Parpadea, mueve las aletas y sorbe: una perla sube por el popote.' },
      { t: 12.6, label: 'Bebida del momento', note: 'Sube a la esquina y presenta la bebida en 3D: el vaso entra girando, caen las perlas, se sirve en capas, se sella, entra el popote y suda. Cada vuelta, una bebida distinta.' },
      { t: 26.6, label: 'Síguenos', note: 'QR real a @koitea.mx con una razón para seguir: promos y bebidas nuevas.' }
    ],
    info: {
      concept: 'La mascota del logo cobra vida en la pantalla central. Se dibuja con tinta, toma su boba y presenta la bebida del momento con su precio. Cada vuelta del loop destaca una bebida distinta: Taro, Koi Tea y Brown Sugar. Cierra con un QR real que abre el Instagram del local y una razón para seguirlo.',
      why: 'Es la evolución directa de lo que hoy muestra la pantalla central: la misma mascota y el mismo llamado a Instagram, pero ahora vende. El trazo negro y el rojo koi son los del logo, y el fondo crema continúa la pared del local en lugar de cortarla.',
      signature: 'Dos momentos: el koi sorbe su boba (una perla sube por el popote y baja el nivel) y la bebida del momento se arma en 3D frente al cliente, con vaso transparente, capas, perlas brillantes, tapa sellada y condensación.',
      specs: [['Formato', 'Pantalla central · 1080 × 1920'], ['Loop', '36 s × 3 bebidas = 108 s'], ['Escenas', '3 por vuelta, de 9 a 14 s'], ['Texto', 'Nombres 132 px · inglés ≥ 48 px'], ['Laterales', 'Como hoy o en crema'], ['Exportación', 'MP4 de 108 s o web']]
    },
    setup() { return { paper: KT.paper(1080, 1920, '#FBF3E8', 11, 0.9) }; },
    draw(ctx, t, view, st) {
      const f = FEAT[view.cycle || 0], d = KT.drink(f.name);
      ctx.drawImage(st.paper, 0, 0, 1080, 1920);
      // marco de galería y olas al pie
      ctx.strokeStyle = KT.rgba(C.ink, 0.1); ctx.lineWidth = 2; ctx.strokeRect(46, 46, 988, 1828);
      waves(ctx, t, 1824, 0.1);
      KT.hanko(ctx, 952 + Math.sin((TAU * t) / L) * 3, 128, 96, '鯉', { alpha: 0.92 });

      // ---- mascota ----
      const pose = mascotPose(t), life = KT.mascotLife(t, L, 0.4);
      const drawP = t < 30 ? E.inOutSine(seg(t, 0.3, 3.4)) : 1 - E.inOutSine(seg(t, 34.8, 35.9));
      const fillP = t < 30 ? E.soft(seg(t, 3.0, 4.3)) : 1 - seg(t, 34.4, 35.2);
      const sip = t < 9 ? seg(t, 6.6, 8.0) : seg(t, 9.3, 10.7);
      const level = 1 - 0.09 * E.inOutCubic(seg(t, 7.2, 8.0)) - 0.09 * E.inOutCubic(seg(t, 9.9, 10.7));
      let bob = life.bob * 0.6 - 16 * Math.sin(Math.PI * seg(t, 8.0, 8.9)) - 16 * Math.sin(Math.PI * seg(t, 10.7, 11.6));
      let finR = life.finR, finL = life.finL, look = [0, 0];
      if (t > 13.6 && t < 26.2) look = [0, 5 + 2 * Math.sin(t * 0.8)];
      if (t > 28 && t < 34.4) { const w = Math.sin(((t - 28) / 1.6) * TAU) * 0.32 * KT.env(t, 28, 34.4, 0.6, 0.8); finR -= w; finL += w * 0.4; }
      // "el vaso manda": en la escena de la bebida, el vasito de la mascota toma el color de la bebida del momento
      const teaK = KT.E.inOutSine(seg(t, 13.4, 15)) * (1 - seg(t, 34.8, 35.6));
      const featTea = d.k === 'fruit' ? KT.mix(d.c1, d.c2, 0.5) : d.c1;
      const useLayers = d.k === 'fruit' && teaK > 0.5;
      KT.mascot(ctx, pose.x, pose.y + bob * (pose.s / 820), pose.s, {
        draw: drawP, fill: fillP, blink: life.blink, finL, finR, whisk: life.whisk, dorsal: life.dorsal,
        sip: sip > 0 && sip < 1 ? sip : 0, level: t < 12.2 ? level : 1, look, lw: 10, tea: KT.mix(C.milk, featTea, teaK),
        teaLayers: useLayers ? d.layers : null, topType: useLayers && d.top && d.top.type === 'jelly' ? 'jelly' : null
      });

      // ---- escena 1: marca ----
      if (t > 3.6 && t < 12.6) {
        const out = t > 11.6 ? t - 11.6 : null;
        KT.textIn(ctx, 'KOI TEA', 540, 1450, { size: 150, weight: 600, family: F.logo, color: C.ink, align: 'center', ls: 24, stagger: 0.07, dur: 1.0 }, t - 3.8, out);
        const subA = 1 - seg(t, 6.8, 7.4), capA = seg(t, 7.2, 7.9);
        if (subA > 0) KT.textIn(ctx, 'Boba shop · Puerto Peñasco', 540, 1556, { size: 56, weight: 500, family: F.sans, color: C.en, align: 'center', alpha: subA, stagger: 0.02 }, t - 4.6, null);
        if (capA > 0) {
          KT.textIn(ctx, 'Boba de calidad, sabor auténtico', 540, 1568, { size: 62, weight: 500, family: F.sans, color: C.red, align: 'center', stagger: 0.02, mode: 'mask' }, t - 7.2, out);
          KT.textIn(ctx, 'Quality boba, authentic flavor', 540, 1646, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', stagger: 0.015, mode: 'fade' }, t - 7.6, out);
        }
      }

      // ---- escena 2: bebida del momento ----
      if (t > 12.6 && t < 27) {
        const out = t > 25.6 ? t - 25.6 : null;
        KT.textIn(ctx, 'BEBIDA DEL MOMENTO', 540, 640, { size: 50, weight: 600, family: F.sans, color: C.red, align: 'center', ls: 6, mode: 'fade', stagger: 0.01 }, t - 13.5, out);
        const NO = { size: 132, weight: 700, style: 'italic', family: F.serif };
        const lines = nameLines(ctx, f.name, NO, 960);
        let y = lines.length > 1 ? 780 : 790;
        lines.forEach((ln, i) => { KT.textIn(ctx, ln, 540, y, Object.assign({ color: C.ink, align: 'center', mode: 'mask', stagger: 0.03, dur: 1.1 }, NO), t - 13.7 - i * 0.25, out); if (i < lines.length - 1) y += 128; });
        KT.textIn(ctx, f.es, 540, y + 96, { size: 58, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade', stagger: 0.012 }, t - 14.6, out);
        KT.textIn(ctx, f.en, 540, y + 160, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.012 }, t - 15.0, out);
        const rise = 1 - E.outCubic(seg(t, 12.8, 14.4)), sink = E.inOutCubic(seg(t, 25.6, 26.8));
        const cupA = KT.clamp(seg(t, 12.8, 13.6)) * (1 - seg(t, 26.2, 26.8));
        if (cupA > 0) {
          // la bebida en 3D: entra girando, caen las perlas, se sirve, hielo, se sella, entra el popote y suda
          const by = 1770 + rise * 260 + sink * 320, H3 = lines.length > 1 ? 620 : 660;
          const s3 = {
            t, alpha: cupA, fill: seg(t, 15.0, 17.8), pearls: seg(t, 14.0, 15.4), ice: f.ice ? seg(t, 17.3, 18.3) : 0,
            seal: seg(t, 18.4, 19.0), straw: seg(t, 19.2, 20.0), cond: seg(t, 19.0, 21.5),
            spin: -1.7 * (1 - E.outCubic(seg(t, 12.8, 15.4))) + 0.28 * Math.sin((TAU * (t - 12.8)) / 11),
            strawColor: d.k === 'fruit' ? '#E2483D' : d.k === 'brown' ? '#3A2A22' : '#8C6FB4', fadeTop: y + 185
          };
          if (!KT.drink3d.draw(ctx, 400, by, H3, d, s3)) {
            ctx.save(); ctx.globalAlpha = cupA;
            KT.cup(ctx, 400, by, lines.length > 1 ? 600 : 640, { drink: d, fill: seg(t, 14.8, 17.6), drop: seg(t, 16.6, 19.6), ice: !!f.ice, wave: (TAU * 18 * t) / L, straw: false, seed: 3 });
            ctx.restore();
          }
          const pa = seg(t, 18.0, 18.8) * (1 - seg(t, 25.4, 25.9));
          KT.priceBlock(ctx, 690, 1420, d.p, { alpha: pa, rule: E.outCubic(seg(t, 18.0, 19.0)) });
        }
      }

      // ---- escena 3: síguenos ----
      if (t > 26.6) {
        const out = t > 34.9 ? t - 34.9 : null;
        KT.textIn(ctx, 'Síguenos', 540, 1010, { size: 150, weight: 700, style: 'italic', family: F.serif, color: C.ink, align: 'center', mode: 'mask', stagger: 0.04, dur: 1.1 }, t - 27.0, out);
        KT.textIn(ctx, 'Follow us on Instagram', 540, 1090, { size: 50, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.015 }, t - 27.6, out);
        const qa = seg(t, 27.4, 28.0) * (1 - seg(t, 35.0, 35.6));
        if (qa > 0) {
          ctx.save(); ctx.globalAlpha = qa;
          ctx.fillStyle = KT.rgba(C.ink, 0.08); ctx.beginPath(); KT.rr(ctx, 540 - 180, 1150, 360, 360, 34); ctx.fill();
          KT.qr(ctx, 540 - 170, 1140, 340, { round: 0.32, radius: 28, reveal: E.outCubic(seg(t, 27.4, 28.6)) });
          ctx.restore();
        }
        KT.textIn(ctx, '@koitea.mx', 540, 1626, { size: 96, weight: 600, family: F.sans, color: C.red, align: 'center', mode: 'fade', stagger: 0.015 }, t - 28.4, out);
        KT.textIn(ctx, 'Promos y bebidas nuevas', 540, 1716, { size: 56, weight: 500, family: F.sans, color: C.ink, align: 'center', mode: 'fade', stagger: 0.01 }, t - 29.0, out);
        KT.textIn(ctx, 'Promos & new drinks', 540, 1782, { size: 48, weight: 400, family: F.sans, color: C.en, align: 'center', mode: 'fade', stagger: 0.01 }, t - 29.3, out);
      }
    }
  });
})();
