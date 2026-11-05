/* Pantallas de menú.
   KT.legacy(ctx, side): cómo se ven HOY (fondo salvia, texto delgado). Se usa en las versiones de solo pantalla central.
   KT.board(ctx, side, o): menú rediseñado y legible a 3–4 m, con resaltado, ES/EN y MXN/USD. Coordenadas de pantalla 1080×1920. */
(function () {
  'use strict';
  const KT = window.KT, TAU = Math.PI * 2, M = () => KT.MENU;

  /* ---------- Pantallas actuales ---------- */
  function legacySprite(side) {
    return KT.sprite('legacy|' + side, 1080, 1920, (g) => {
      const bg = g.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, '#BFCDC5'); bg.addColorStop(1, '#AFC0B6');
      g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
      const ink = '#3F4844';
      const T = (s, x, y, size, w, al, ls, a) => KT.text(g, s, x, y, { size, weight: w, family: KT.F.sans, color: ink, align: al, ls: ls || 0, alpha: a == null ? 0.85 : a });
      if (side === 'C') {
        KT.mascot(g, 540, 900, 900, { tea: '#C2A6CF', patch: '#E0806C', lw: 9 });
        T('Síguenos en Instagram', 540, 1800, 46, 400, 'center', 0, 0.9);
        return;
      }
      const row = (name, y, price) => { T(name.toUpperCase(), 92, y, 38, 400, 'left', 2); T(price, 988, y, 30, 400, 'right', 0, 0.6); };
      if (side === 'L') {
        T('MILK TEA', 540, 190, 64, 600, 'center', 10, 0.9); T('TÉ CON LECHE', 540, 236, 22, 400, 'center', 6, 0.6);
        M().milk.items.forEach((d, i) => row(d.n, 360 + i * 112, '$' + d.p));
        T('FRUIT TEA', 540, 1000, 64, 600, 'center', 10, 0.9); T('TÉ VERDE CON FRUTA', 540, 1046, 22, 400, 'center', 6, 0.6);
        M().fruit.items.forEach((d, i) => row(d.n, 1170 + i * 112, '$' + d.p));
        T('GRANDE', 988, 1790, 26, 500, 'right', 4, 0.7);
        T('*TODAS LAS BEBIDAS INCLUYEN 1 TOPPING GRATIS', 92, 1860, 22, 400, 'left', 2, 0.7);
      } else {
        T('SMOOTHIES', 540, 190, 64, 600, 'center', 10, 0.9);
        M().smooth.items.forEach((d, i) => row(d.n, 340 + i * 104, '$' + d.p));
        T('TOPPINGS PARA BEBIDA', 540, 860, 52, 600, 'center', 8, 0.9);
        T('• TAPIOCA', 540, 980, 34, 400, 'center', 2);
        T('PERLAS EXPLOSIVAS', 92, 1100, 30, 600, 'left', 3); T('JELLYS', 760, 1100, 30, 600, 'left', 3);
        M().toppings.pops.flavors.forEach((f, i) => T('• ' + f.toUpperCase(), 110, 1200 + i * 92, 32, 400, 'left', 2));
        M().toppings.jellys.flavors.forEach((f, i) => T('• ' + f.toUpperCase(), 778, 1200 + i * 92, 32, 400, 'left', 2));
      }
    }, { text: true });
  }
  KT.legacy = function (ctx, side) { ctx.drawImage(legacySprite(side), 0, 0, 1080, 1920); };
  // laterales recoloreadas para las versiones de solo pantalla central: mismo menú, crema y tinta, sin animación
  KT.sidesCream = function (ctx, side) {
    const sp = KT.sprite('cream|' + side, 1080, 1920, (g) => {
      g.fillStyle = '#FBF3E8'; g.fillRect(0, 0, 1080, 1920);
      KT.text(g, 'KOI TEA', 540, 150, { size: 64, weight: 600, family: KT.F.logo, color: KT.C.ink, align: 'center', ls: 13 });
      g.fillStyle = KT.rgba(KT.C.ink, 0.2); g.fillRect(490, 186, 100, 3);
      KT.boardText(g, side, { top: 200 });
    }, { text: true });
    ctx.drawImage(sp, 0, 0, 1080, 1920);
  };

  /* ---------- Menú rediseñado (legible a 3–4 m) ----------
     Tamaños para pantallas de ~55" (estimadas con la foto): nombres y precios 62 px, inglés/secundario ≥ 46 px,
     encabezados en cursiva 124 px. Precios sin "$" y una sola etiqueta MXN por pantalla. Nombres y precios no se mueven.
     La franja superior (0 → top) queda libre para la animación de marca. */
  const EN_NAME = { 'Maracuyá Green Tea': 'Passion fruit', 'Fresa Green Tea': 'Strawberry', 'Durazno Green Tea': 'Peach', 'Lichi Green Tea': 'Lychee', 'Fresa': 'Strawberry', 'Maracuyá': 'Passion fruit' };
  KT.boardLayout = function (side, top) {
    const y0 = top == null ? 256 : top, rows = [];
    const item = (d, y) => { rows.push({ kind: 'item', d, y, en: EN_NAME[d.n] || null }); return y + 86 + (EN_NAME[d.n] ? 52 : 0); };
    if (side === 'L') {
      rows.push({ kind: 'head', sec: 'milk', y: y0 + 104 });
      let y = y0 + 222;
      M().milk.items.forEach(d => (y = item(d, y)));
      rows.push({ kind: 'head', sec: 'fruit', y: y - 86 + 150 });
      y = y - 86 + 150 + 120;
      M().fruit.items.forEach(d => (y = item(d, y)));
      rows.push({ kind: 'foot', y: y - 86 + 96, es: 'Precios en pesos mexicanos (MXN)', en: 'Prices in Mexican pesos' });
    } else {
      rows.push({ kind: 'head', sec: 'smooth', y: y0 + 104 });
      let y = y0 + 222;
      M().smooth.items.forEach(d => (y = item(d, y)));
      const hy = y - 86 + 150 - (EN_NAME['Maracuyá'] ? 52 : 0) + 52;
      rows.push({ kind: 'head', sec: 'toppings', y: hy });
      rows.push({ kind: 'tapioca', y: hy + 120 });
      rows.push({ kind: 'cols', y: hy + 220 });
      rows.push({ kind: 'foot', y: hy + 220 + 132 + 6 * 72 + 30, es: '1 topping incluido · precios en MXN', en: '1 topping included · prices in Mexican pesos' });
    }
    return rows;
  };
  KT.boardRows = KT.boardLayout;

  /* o: {top, bg, ink, en, accent, rule, title: {family, style, weight, size}, hi: {name, k}, swatch (bool), x, w, alpha, scale}
     El texto del menú se dibuja una sola vez en un sprite (nombres y precios nunca cambian); cada cuadro solo se
     dibuja el resaltado debajo y se copia el sprite. */
  KT.board = function (ctx, side, o = {}) {
    if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, 1080, 1920); }
    const accent = o.accent || KT.C.red, X = o.x == null ? 92 : o.x, W = o.w == null ? 896 : o.w;
    const top0 = o.top == null ? 256 : o.top, sc = o.scale || 1;
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    // resaltado (debajo del texto)
    if (o.hi && o.hi.k > 0) {
      const r = KT.boardLayout(side, top0).find(r => r.kind === 'item' && r.d.n === o.hi.name);
      if (r) {
        const hk = KT.E.inOutCubic(KT.clamp(o.hi.k)), NS = 62, h = NS * 1.42 + (r.en ? 52 : 0);
        ctx.save(); if (sc !== 1) { ctx.translate(540, top0); ctx.scale(sc, sc); ctx.translate(-540, -top0); }
        // halo cálido, como luz sobre el renglón (sin barra lateral de "selección")
        const g = ctx.createLinearGradient(X - 30, 0, X + W + 30, 0);
        g.addColorStop(0, KT.rgba('#FFD58A', 0)); g.addColorStop(0.12, KT.rgba('#FFD58A', 0.42 * hk)); g.addColorStop(0.88, KT.rgba('#FFD58A', 0.42 * hk)); g.addColorStop(1, KT.rgba('#FFD58A', 0));
        ctx.fillStyle = g; ctx.beginPath(); KT.rr(ctx, X - 30, r.y - NS * 1.0, W + 60, h, h / 2); ctx.fill();
        ctx.restore();
      }
    }
    const key = ['board', side, top0, sc, o.ink || '', o.en || '', o.swatch === false ? 0 : 1, JSON.stringify(o.title || {})].join('|');
    const sp = KT.sprite(key, 1080, 1920, g => KT.boardText(g, side, Object.assign({}, o, { hi: null, alpha: null, bg: null })), { text: true });
    ctx.drawImage(sp, 0, 0, 1080, 1920);
    ctx.globalAlpha = a0;
  };
  KT.boardText = function (ctx, side, o = {}) {
    const ink = o.ink || KT.C.ink, en = o.en || KT.C.en, accent = o.accent || KT.C.red;
    const X = o.x == null ? 92 : o.x, W = o.w == null ? 896 : o.w, R = X + W;
    const title = Object.assign({ family: KT.F.serif, style: 'italic', weight: 600, size: 124 }, o.title || {});
    const NS = 62, ES = 46;
    if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, 1080, 1920); }
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    const top0 = o.top == null ? 256 : o.top;
    if (o.scale && o.scale !== 1) { ctx.save(); ctx.translate(540, top0); ctx.scale(o.scale, o.scale); ctx.translate(-540, -top0); }
    KT.boardLayout(side, o.top).forEach(r => {
      if (r.kind === 'head') {
        const sec = r.sec === 'toppings' ? M().toppings : M()[r.sec];
        const sub = { milk: ['Té con leche', 'Milk tea'], fruit: ['Té verde y fruta', 'Green tea & fruit'], smooth: ['Frappé de fruta', 'Blended fruit'], toppings: ['Para tu bebida', 'For your drink'] }[r.sec];
        const subW = Math.max(KT.measure(ctx, sub[0], { size: ES, weight: 500, family: KT.F.sans }), KT.measure(ctx, sub[1], { size: 40, family: KT.F.sans }));
        KT.text(ctx, sec.es, X - 4, r.y, Object.assign({ color: ink }, KT.fit(ctx, sec.es, title, W - subW - 40, 96)));
        KT.text(ctx, sub[0], R, r.y - 46, { size: ES, weight: 500, family: KT.F.sans, color: ink, align: 'right' });
        KT.text(ctx, sub[1], R, r.y + 4, { size: 40, weight: 400, family: KT.F.sans, color: en, align: 'right' });
        ctx.fillStyle = o.rule || KT.rgba(ink, 0.22); ctx.fillRect(X, r.y + 30, W, 3);
      } else if (r.kind === 'item') {
        const hk = o.hi && o.hi.name === r.d.n ? KT.E.inOutCubic(KT.clamp(o.hi.k)) : 0;
        const h = NS * 1.42 + (r.en ? 52 : 0);
        if (hk > 0) { ctx.fillStyle = KT.rgba(accent, 0.12 * hk); ctx.beginPath(); KT.rr(ctx, X - 26, r.y - NS * 1.0, W + 52, h, 30); ctx.fill(); ctx.fillStyle = KT.rgba(accent, 0.9 * hk); ctx.beginPath(); KT.rr(ctx, X - 26, r.y - NS * 1.0, 8, h, 4); ctx.fill(); }
        let nx = X;
        if (o.swatch !== false) { const g = ctx.createLinearGradient(0, r.y - 44, 0, r.y + 4); g.addColorStop(0, r.d.c2 || r.d.c1); g.addColorStop(1, r.d.c1); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X + 16, r.y - 21, 16, 0, TAU); ctx.fill(); ctx.strokeStyle = KT.rgba(ink, 0.25); ctx.lineWidth = 2; ctx.stroke(); nx = X + 50; }
        const nw = KT.text(ctx, r.d.n, nx, r.y, { size: NS, weight: 500, family: KT.F.sans, color: ink });
        if (r.d.house) { // etiqueta "Casa · House" en lugar de un sello suelto
          const tx = nx + nw + 24, lab = 'Casa · House', tw = KT.measure(ctx, lab, { size: 40, weight: 600, family: KT.F.sans, ls: 1 });
          ctx.strokeStyle = KT.rgba(KT.C.red, 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); KT.rr(ctx, tx, r.y - 48, tw + 30, 56, 28); ctx.stroke();
          KT.text(ctx, lab, tx + 15, r.y - 7, { size: 40, weight: 600, family: KT.F.sans, color: KT.C.red, ls: 1 });
        }
        if (r.en) KT.text(ctx, r.en + (r.d.k === 'fruit' ? ' green tea' : ''), nx, r.y + 52, { size: ES, weight: 400, family: KT.F.sans, color: en });
        KT.text(ctx, String(r.d.p), R, r.y, { size: NS, weight: 600, family: KT.F.sans, color: ink, align: 'right' });
      } else if (r.kind === 'tapioca') {
        ctx.fillStyle = KT.C.pearl; ctx.beginPath(); ctx.arc(X + 16, r.y - 21, 16, 0, TAU); ctx.fill();
        KT.text(ctx, M().toppings.tapioca.es, X + 50, r.y, { size: NS, weight: 500, family: KT.F.sans, color: ink });
        KT.text(ctx, M().toppings.tapioca.en, X + 50 + KT.measure(ctx, 'Tapioca', { size: NS, weight: 500, family: KT.F.sans }) + 26, r.y, { size: ES, weight: 400, family: KT.F.sans, color: en });
      } else if (r.kind === 'cols') {
        const T = M().toppings, cx2 = X + W * 0.54;
        KT.text(ctx, T.pops.es, X, r.y, { size: ES + 2, weight: 600, family: KT.F.sans, color: ink });
        KT.text(ctx, T.pops.en, X, r.y + 50, { size: 40, weight: 400, family: KT.F.sans, color: en });
        KT.text(ctx, T.jellys.es, cx2, r.y, { size: ES + 2, weight: 600, family: KT.F.sans, color: ink });
        KT.text(ctx, T.jellys.en, cx2, r.y + 50, { size: 40, weight: 400, family: KT.F.sans, color: en });
        T.pops.flavors.forEach((f, j) => { const y = r.y + 132 + j * 72; KT.popPearl(ctx, X + 17, y - 16, 17, T.pops.colors[j]); KT.text(ctx, f, X + 52, y, { size: ES, weight: 400, family: KT.F.sans, color: ink }); });
        T.jellys.flavors.forEach((f, j) => { const y = r.y + 132 + j * 72; KT.jelly(ctx, cx2 + 17, y - 16, 32, T.jellys.colors[j], 0.15); KT.text(ctx, f, cx2 + 52, y, { size: ES, weight: 400, family: KT.F.sans, color: ink }); });
      } else if (r.kind === 'foot') {
        KT.text(ctx, r.es, X, r.y, { size: ES, weight: 500, family: KT.F.sans, color: ink });
        KT.text(ctx, r.en, X, r.y + 50, { size: 40, weight: 400, family: KT.F.sans, color: en });
      }
    });
    if (o.scale && o.scale !== 1) ctx.restore();
    ctx.globalAlpha = a0;
  };
  // alto total que ocupa el menú desde su "top" (para escalarlo si hace falta)
  KT.boardHeight = side => { const rows = KT.boardLayout(side, 0); const last = rows[rows.length - 1]; return last.y + 50 + 14; };
})();
