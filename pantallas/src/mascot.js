/* La mascota de Koi Tea en vector, calcada del logo (coordenadas del archivo de 900 × 900).
   KT.mascot(ctx, cx, cy, size, st) dibuja la composición completa (koi + vaso) centrada en (cx, cy),
   con 'size' = alto de la caja de 900 unidades. Estados animables en st. */
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2;
  const D = {
    head: 'M416 160 C378 164 338 190 316 230 C294 272 286 316 286 362 C286 426 324 474 386 485 C416 490 486 490 516 485 C578 474 616 426 616 362 C616 316 606 272 584 230 C562 190 522 164 486 160 C462 157 440 157 416 160 Z',
    dorsal: 'M412 162 C420 140 440 112 455 100 C470 112 488 140 492 162',
    patch: 'M420 162 C452 150 500 158 524 182 C546 204 548 232 538 250 C552 266 548 288 524 290 C510 291 500 282 494 290 C488 308 474 322 458 330 C440 336 426 324 426 310 C404 314 384 300 384 280 C384 262 396 252 404 246 C394 226 398 202 404 188 C408 176 412 168 420 162 Z',
    patch2: 'M562 248 C582 262 600 292 602 330 C602 344 590 346 586 334 C580 306 572 284 556 262 C552 254 556 246 562 248 Z',
    finL: 'M300 398 C262 398 232 396 214 402 C186 412 164 428 156 444 C164 470 194 492 228 503 C256 510 288 506 314 494',
    finR: 'M600 398 C638 398 668 396 686 402 C714 412 736 428 744 444 C736 470 706 492 672 503 C644 510 612 506 586 494',
    raysL: 'M290 438 C272 440 252 446 236 456 M294 454 C282 458 268 464 258 472',
    raysR: 'M610 438 C628 440 648 446 664 456 M606 454 C618 458 632 464 642 472',
    whiskL: 'M350 440 C338 444 326 450 320 460 C314 472 318 486 320 496 C322 506 314 514 302 520',
    whiskR: 'M550 440 C562 444 574 450 580 460 C586 472 582 486 580 496 C578 506 586 514 598 520',
    mouth: 'M424 448 C430 440 438 438 444 442 M476 448 C470 440 462 438 456 442',
    dome: 'M354 552 C374 532 418 523 450 523 C482 523 526 532 546 552',
    lid: 'M346 560 C346 552 352 548 362 548 L538 548 C548 548 554 552 554 560 L556 578 C556 584 550 588 542 588 L358 588 C350 588 344 584 344 578 Z',
    cup: 'M360 590 L392 780 C394 788 400 792 410 792 L490 792 C500 792 506 788 508 780 L540 590 Z'
  };
  const P = {}; Object.keys(D).forEach(k => (P[k] = new Path2D(D[k])));
  KT.MASCOT_D = D;
  const PEARLS = [[404, 694], [496, 692], [432, 721], [468, 721], [406, 751], [449, 763], [492, 752]];

  // st: {line, body, patch, tea, pearl, cup, lw, blink, finL, finR, look:[dx,dy], level (0→1), sip (0→1 perla en el popote),
  //      draw (0→1 dibujo de línea), fill (0→1 aparición de colores), noCup, noStraw, tilt, whisk}
  KT.mascot = function (ctx, cx, cy, size, st = {}) {
    const s = size / 900, line = st.line || KT.C.ink, lw = (st.lw || 10);
    const draw = st.draw == null ? 1 : st.draw, fill = st.fill == null ? 1 : st.fill;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-450, -450);
    if (st.tilt) { ctx.translate(450, 470); ctx.rotate(st.tilt); ctx.translate(-450, -470); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = line; ctx.lineWidth = lw;
    const body = st.body || '#FFFFFF';
    const fa = KT.clamp(fill);

    // aletas laterales (detrás de la cabeza), con aleteo
    const fin = (path, rays, side) => {
      const ang = side < 0 ? (st.finL || 0) : (st.finR || 0);
      ctx.save(); const px = side < 0 ? 300 : 600, py = 430;
      ctx.translate(px, py); ctx.rotate(ang * side * -1); ctx.translate(-px, -py);
      if (fa > 0) { ctx.globalAlpha = fa; ctx.fillStyle = body; const f = new Path2D(D[side < 0 ? 'finL' : 'finR'] + (side < 0 ? ' L330 420 L310 398 Z' : ' L570 420 L590 398 Z')); ctx.fill(f); ctx.globalAlpha = 1; }
      KT.strokeD(ctx, D[side < 0 ? 'finL' : 'finR'], KT.seg(draw, 0.25, 0.6), path);
      ctx.save(); ctx.lineWidth = lw * 0.62; KT.strokeD(ctx, D[side < 0 ? 'raysL' : 'raysR'], KT.seg(draw, 0.45, 0.75), rays); ctx.restore();
      ctx.restore();
    };
    fin(P.finL, P.raysL, -1); fin(P.finR, P.raysR, 1);

    // cabeza
    if (fa > 0) {
      ctx.globalAlpha = fa; ctx.fillStyle = body; ctx.fill(P.head);
      ctx.save(); ctx.clip(P.head); ctx.fillStyle = st.patch || KT.C.koi; ctx.fill(P.patch); ctx.fill(P.patch2); ctx.restore();
      ctx.globalAlpha = 1;
    }
    KT.strokeD(ctx, D.head, KT.seg(draw, 0, 0.45), P.head);
    // aleta dorsal (con meneo)
    ctx.save(); if (st.dorsal) { ctx.translate(452, 160); ctx.rotate(st.dorsal); ctx.translate(-452, -160); }
    if (fa > 0) { ctx.globalAlpha = fa; ctx.fillStyle = body; ctx.fill(new Path2D(D.dorsal + ' Z')); ctx.globalAlpha = 1; }
    KT.strokeD(ctx, D.dorsal, KT.seg(draw, 0.05, 0.3), P.dorsal); ctx.restore();

    // ojos (parpadeo y mirada)
    const eyeP = KT.seg(draw, 0.5, 0.7);
    if (eyeP > 0) {
      const bl = KT.clamp(st.blink || 0), lk = st.look || [0, 0];
      ctx.fillStyle = line;
      [[348, 367], [550, 367]].forEach(([ex, ey]) => {
        const ry = 16 * (1 - bl * 0.92) * KT.E.outBack(eyeP), rx = 12.5 * KT.E.outBack(eyeP);
        ctx.beginPath(); ctx.ellipse(ex + lk[0], ey + lk[1], rx, Math.max(1.5, ry), 0, 0, TAU); ctx.fill();
        if (bl < 0.5 && st.shine !== false) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + lk[0] - 4, ey + lk[1] - 6, 3.2 * eyeP, 0, TAU); ctx.fill(); ctx.fillStyle = line; }
      });
    }
    // bigotes (con vaivén)
    ctx.save(); ctx.lineWidth = lw * 0.75;
    const wk = st.whisk || 0;
    ctx.save(); ctx.translate(320, 460); ctx.rotate(wk); ctx.translate(-320, -460); KT.strokeD(ctx, D.whiskL, KT.seg(draw, 0.55, 0.85), P.whiskL); ctx.restore();
    ctx.save(); ctx.translate(580, 460); ctx.rotate(-wk); ctx.translate(-580, -460); KT.strokeD(ctx, D.whiskR, KT.seg(draw, 0.55, 0.85), P.whiskR); ctx.restore();
    ctx.restore();

    if (!st.noCup) {
      // popote
      if (!st.noStraw) {
        const sp = KT.seg(draw, 0.6, 0.8);
        if (fa > 0) { ctx.globalAlpha = fa; ctx.fillStyle = st.straw || '#F4EFE9'; ctx.fillRect(436, 440, 24, 112); ctx.globalAlpha = 1; }
        // perla subiendo por el popote
        if (st.sip > 0 && st.sip < 1) { const yy = 548 - 104 * KT.E.inOutSine(st.sip); ctx.fillStyle = st.pearl || KT.C.pearl; ctx.beginPath(); ctx.arc(448, yy, 9.5, 0, TAU); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(436, 442); ctx.lineTo(436, 548); ctx.moveTo(460, 442); ctx.lineTo(460, 548);
        ctx.save(); ctx.lineWidth = lw * 0.8; if (sp < 1) { ctx.setLineDash([106 * sp, 400]); } ctx.stroke(); ctx.restore();
      }
      ctx.save(); ctx.lineWidth = lw * 0.75; KT.strokeD(ctx, D.mouth, KT.seg(draw, 0.6, 0.8), P.mouth); ctx.restore();
      // vaso
      const cupP = KT.seg(draw, 0.55, 0.95);
      if (fa > 0) {
        ctx.globalAlpha = fa; ctx.fillStyle = st.cupFill || 'rgba(255,255,255,0.92)'; ctx.fill(P.cup);
        ctx.save(); ctx.clip(P.cup);
        const lvl = st.level == null ? 1 : KT.clamp(st.level);
        const top = 792 - (792 - 628) * lvl;
        ctx.fillStyle = st.tea || KT.C.milk; ctx.fillRect(330, top, 240, 800 - top);
        const pc = st.pearls == null ? PEARLS.length : st.pearls;
        for (let i = 0; i < Math.min(pc, PEARLS.length); i++) { ctx.fillStyle = st.pearl || KT.C.pearl; ctx.beginPath(); ctx.arc(PEARLS[i][0], PEARLS[i][1], 13, 0, TAU); ctx.fill(); }
        ctx.restore();
        ctx.fillStyle = st.lidFill || '#FFFFFF'; ctx.fill(new Path2D(D.dome + ' Z')); ctx.fill(P.lid); ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.lineWidth = lw * 0.85; KT.strokeD(ctx, D.dome, cupP, P.dome); KT.strokeD(ctx, D.lid, cupP, P.lid); KT.strokeD(ctx, D.cup, KT.seg(draw, 0.65, 1), P.cup); ctx.restore();
    }
    ctx.restore();
  };

  // cara de frente sin vaso (para composiciones donde el koi "asoma")
  KT.mascotHead = function (ctx, cx, cy, size, st = {}) { KT.mascot(ctx, cx, cy, size, Object.assign({}, st, { noCup: true })); };

  // pequeño ciclo de vida para la mascota: parpadeo y aleteo deterministas en función de t
  KT.mascotLife = function (t, L, seed = 0) {
    const blinkAt = [0.18, 0.52, 0.81].map(u => u * L), bw = 0.16;
    let blink = 0; blinkAt.forEach(b => { const d = Math.abs(KT.wrap(t - b + L / 2, L) - L / 2); if (d < bw) blink = Math.max(blink, 1 - d / bw); });
    const k = Math.max(1, Math.round(L / 3));
    return {
      blink,
      finL: 0.10 * Math.sin((TAU * k * t) / L + seed) + 0.04,
      finR: 0.10 * Math.sin((TAU * k * t) / L + seed + 0.6) + 0.04,
      whisk: 0.05 * Math.sin((TAU * k * t) / L + 1.3),
      dorsal: 0.05 * Math.sin((TAU * k * 2 * t) / L),
      bob: 10 * Math.sin((TAU * Math.max(1, Math.round(L / 4)) * t) / L)
    };
  };
})();
