/* Koi Tea · Pantallas — kit compartido.
   Todo se dibuja en Canvas 2D y es una función pura del tiempo t (segundos dentro del loop),
   para que el mismo código sirva para la vista web, la sincronía por reloj y la exportación a MP4.
   Lienzo de diseño por pantalla: 1080 × 1920. */
(function () {
  'use strict';
  const KT = (window.KT = window.KT || {});
  KT.versions = KT.versions || [];
  KT.register = function (def) { KT.versions.push(def); };

  /* ---------- Geometría de las pantallas ---------- */
  KT.SW = 1080; KT.SH = 1920;
  KT.GAP = 240;                       // hueco físico entre pantallas (≈22% del ancho), medido en la foto de la barra
  // modo kiosco (fuera del artifact): ?screen=L|C|R&v=v3&gap=240&dy=0&lat=0 — el hueco se calibra en sitio
  try { const q = new URLSearchParams(location.search); const g = parseFloat(q.get('gap')); if (q.get('screen') && g > 0 && g < 2000) KT.GAP = g; } catch (e) { /* sin parámetros */ }
  KT.WORLD3 = KT.SW * 3 + KT.GAP * 2; // 3720
  KT.X0 = { L: 0, C: KT.SW + KT.GAP, R: (KT.SW + KT.GAP) * 2 };

  /* ---------- Paleta de marca ---------- */
  KT.C = {
    cream: '#FEF4EB', paper: '#FBF3E8', paper2: '#F3E6D4', paper3: '#EBDCC6',
    ink: '#2A2523', ink2: '#4A403B', mute: '#7A6D64',
    koi: '#F94E2B', koiDeep: '#D9442A', koiDark: '#B23A22',
    milk: '#D0A585', ceiling: '#C39056', walnut: '#483D42', walnutDeep: '#2E2729',
    sage: '#AFC0B6', sageDeep: '#8FA397', sagePale: '#DCE5DF',
    taro: '#AA81B3', white: '#FFFDF9', pearl: '#2E1E18', gold: '#E9B44C',
    red: '#B83219',      // rojo para TEXTO sobre crema (5.4:1); el koi brillante queda para la mascota y adornos
    en: '#483D42'        // inglés / secundario sobre crema (9.4:1)
  };

  /* ---------- Tipografías (Google Fonts) ---------- */
  KT.F = {
    serif: '"DM Serif Display", "Bodoni Moda", "Didot", Georgia, serif',   // cursiva de alto contraste con trazos finos que aguantan la distancia
    sans: '"Jost", "Futura", "Avenir Next", "Segoe UI", system-ui, sans-serif',
    logo: '"Jost", "Futura", "Avenir Next", system-ui, sans-serif',          // logotipo: sans geométrica con O circular, como las letras de acero del local
    mincho: '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif',
    brush: '"Yuji Syuku", "Shippori Mincho", "Hiragino Mincho ProN", serif'
  };
  KT.FONT_LOADS = [
    'italic 400 100px "DM Serif Display"', '400 100px "DM Serif Display"',
    '300 60px "Jost"', '400 60px "Jost"', '500 60px "Jost"', '600 60px "Jost"', '700 60px "Jost"',
    '600 60px "Shippori Mincho"', '800 60px "Shippori Mincho"',
    '400 60px "Yuji Syuku"'
  ];
  KT.fontsReady = (function () {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const loads = KT.FONT_LOADS.map(f => document.fonts.load(f, 'KOI TEA 鯉茶珍珠奶 $0123456789 áéíóú').catch(() => null));
    const all = Promise.all(loads).then(() => document.fonts.ready);
    const timeout = new Promise(r => setTimeout(r, 4500));
    return Promise.race([all, timeout]).then(() => { KT._fontsDone = true; KT._layoutCache && KT._layoutCache.clear(); });
  })();

  /* ---------- Matemática ---------- */
  const TAU = Math.PI * 2; KT.TAU = TAU;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  KT.clamp = clamp;
  KT.lerp = (a, b, t) => a + (b - a) * t;
  KT.seg = (t, a, b) => clamp((t - a) / (b - a));          // 0→1 entre a y b
  KT.env = function (t, a, b, fi = 0.6, fo = 0.6) {         // envolvente de entrada/salida
    if (t <= a || t >= b) return 0;
    return clamp(Math.min((t - a) / fi, (b - t) / fo));
  };
  KT.wrap = (v, m) => ((v % m) + m) % m;
  KT.smooth = x => x * x * (3 - 2 * x);

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) return sy(t); const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      let lo = 0, hi = 1; t = x;
      for (let i = 0; i < 40; i++) { const v = sx(t); if (Math.abs(v - x) < 1e-6) break; if (x > v) lo = t; else hi = t; t = (lo + hi) / 2; }
      return sy(t);
    };
  }
  KT.bezier = bezier;
  KT.E = {
    lin: x => x,
    inQuad: x => x * x, outQuad: x => 1 - (1 - x) * (1 - x),
    inOutQuad: x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inCubic: x => x * x * x, outCubic: x => 1 - Math.pow(1 - x, 3),
    inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: x => 1 - Math.pow(1 - x, 4), inOutQuart: x => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outQuint: x => 1 - Math.pow(1 - x, 5),
    outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inOutExpo: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2, outSine: x => Math.sin((x * Math.PI) / 2),
    outBack: x => { const c1 = 1.20158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    silk: bezier(0.76, 0, 0.24, 1),      // entradas/salidas de bloques grandes
    soft: bezier(0.22, 0.8, 0.2, 1),     // apariciones suaves
    ink: bezier(0.45, 0.05, 0.25, 1)     // trazos de tinta
  };
  // fase local (0→1) con easing entre a y b
  KT.ph = (t, a, b, ease) => (ease || KT.E.inOutCubic)(clamp((t - a) / (b - a)));

  /* ---------- Azar determinista y ruido periódico ---------- */
  KT.hash = function (n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
  KT.rng = function (seed) {
    let a = (seed * 2654435761) >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  // ruido suave periódico en [-1,1] con periodo L (para loops perfectos)
  KT.lnoise = function (t, L, seed = 0, harmonics = 3) {
    let s = 0, n = 0;
    for (let k = 1; k <= harmonics; k++) { const a = 1 / k; s += a * Math.sin((TAU * k * t) / L + KT.hash(seed * 31 + k) * TAU); n += a; }
    return s / n;
  };

  /* ---------- Color ---------- */
  const rgbCache = new Map();
  KT.rgb = function (hex) {
    let v = rgbCache.get(hex); if (v) return v;
    let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(hex, v); return v;
  };
  KT.rgba = (hex, a) => { const c = KT.rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  KT.mix = function (a, b, t) {
    const A = KT.rgb(a), B = KT.rgb(b);
    const m = i => Math.round(A[i] + (B[i] - A[i]) * t);
    return '#' + ((1 << 24) | (m(0) << 16) | (m(1) << 8) | m(2)).toString(16).slice(1);
  };

  // mezcla en OKLCH (tono por el camino corto): pasa de índigo a crema sin el gris de la mezcla RGB
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const gam = c => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(clamp(v) * 255); };
  const toOklch = hex => {
    const [R, G, B] = KT.rgb(hex).map(lin);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [L, Math.hypot(a, b), Math.atan2(b, a)];
  };
  const fromOklch = ([L, C, h]) => {
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    const R = gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), G = gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), B = gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
    return '#' + ((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1);
  };
  KT.mixOklch = function (a, b, t) {
    if (t <= 0) return a; if (t >= 1) return b;
    const A = toOklch(a), B = toOklch(b);
    let dh = B[2] - A[2]; if (dh > Math.PI) dh -= TAU; if (dh < -Math.PI) dh += TAU;
    const hA = A[1] < 0.02 ? B[2] : A[2], hB = B[1] < 0.02 ? A[2] : B[2];
    let d2 = hB - hA; if (d2 > Math.PI) d2 -= TAU; if (d2 < -Math.PI) d2 += TAU;
    return fromOklch([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, hA + d2 * t]);
  };

  /* ---------- Texto ---------- */
  const hasLS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  // DM Serif Display solo tiene peso 400: se fuerza para que el navegador no invente una negrita
  KT.font = o => `${o.style || 'normal'} ${o.family === KT.F.serif ? 400 : (o.weight || 400)} ${o.size || 48}px ${o.family || KT.F.sans}`;
  KT._layoutCache = new Map();
  // posiciones x de cada carácter (respeta kerning e interletrado)
  KT.layout = function (ctx, s, o) {
    const f = KT.font(o), ls = o.ls || 0, key = f + '|' + ls + '|' + s;
    let L = KT._layoutCache.get(key);
    if (L) return L;
    ctx.save(); ctx.font = f; if (hasLS) ctx.letterSpacing = '0px';
    const chars = Array.from(s), xs = [];
    let prefix = '';
    for (let i = 0; i < chars.length; i++) { xs.push(ctx.measureText(prefix).width + i * ls); prefix += chars[i]; }
    const w = ctx.measureText(s).width + Math.max(0, chars.length - 1) * ls;
    const m = ctx.measureText('Hxgá');
    ctx.restore();
    L = { chars, xs, w, asc: m.actualBoundingBoxAscent || o.size * 0.75, desc: m.actualBoundingBoxDescent || o.size * 0.25 };
    if (KT._layoutCache.size > 4000) KT._layoutCache.clear();
    KT._layoutCache.set(key, L);
    return L;
  };
  KT.measure = (ctx, s, o) => KT.layout(ctx, s, o).w;
  function startX(L, x, align) { return align === 'center' ? x - L.w / 2 : align === 'right' ? x - L.w : x; }
  // texto simple: KT.text(ctx, 'Hola', x, y, {size, weight, family, style, color, align, ls, alpha, baseline})
  KT.text = function (ctx, s, x, y, o = {}) {
    if (!s) return 0;
    const ls = o.ls || 0;
    ctx.font = KT.font(o); ctx.fillStyle = o.color || KT.C.ink; ctx.textBaseline = o.baseline || 'alphabetic'; ctx.textAlign = 'left';
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    const L = KT.layout(ctx, s, o), x0 = startX(L, x, o.align);
    if (!ls) ctx.fillText(s, x0, y);
    else if (hasLS) { ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x0, y); ctx.letterSpacing = '0px'; }
    else { for (let i = 0; i < L.chars.length; i++) ctx.fillText(L.chars[i], x0 + L.xs[i], y); }
    ctx.globalAlpha = a0;
    return L.w;
  };
  // texto con entrada letra por letra. lt = segundos desde que empieza la entrada (negativo = aún no),
  // out = segundos desde que empieza la salida (null = sin salida).
  // o.mode: 'rise' (sube y aparece), 'fade', 'mask' (sube detrás de una máscara de línea)
  KT.textIn = function (ctx, s, x, y, o, lt, out) {
    if (!s) return 0;
    const n = Array.from(s).length, d = o.stagger == null ? 0.035 : o.stagger, D = o.dur || 0.9;
    if (lt < 0) return 0;
    const L = KT.layout(ctx, s, o), x0 = startX(L, x, o.align), mode = o.mode || 'rise';
    const ease = o.ease || KT.E.soft, rise = o.rise == null ? o.size * 0.45 : o.rise;
    const a0 = ctx.globalAlpha, baseA = o.alpha == null ? 1 : o.alpha;
    ctx.font = KT.font(o); ctx.fillStyle = o.color || KT.C.ink; ctx.textBaseline = o.baseline || 'alphabetic'; ctx.textAlign = 'left';
    if (hasLS) ctx.letterSpacing = '0px';
    if (mode === 'mask') {
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - o.size, y - L.asc - o.size * 0.25, L.w + o.size * 2, L.asc + L.desc + o.size * 0.5); ctx.clip();
    }
    for (let i = 0; i < L.chars.length; i++) {
      let p = ease(clamp((lt - i * d) / D));
      if (out != null && out > 0) { const q = KT.E.inOutCubic(clamp((out - (n - 1 - i) * d * 0.5) / (D * 0.7))); p = Math.min(p, 1 - q); }
      if (p <= 0) continue;
      const dy = mode === 'fade' ? 0 : (1 - p) * (mode === 'mask' ? L.asc + L.desc + o.size * 0.2 : rise);
      ctx.globalAlpha = a0 * baseA * (mode === 'mask' ? 1 : p);
      ctx.fillText(L.chars[i], x0 + L.xs[i], y + dy);
    }
    if (mode === 'mask') ctx.restore();
    ctx.globalAlpha = a0;
    return L.w;
  };
  // segundos que tarda en entrar un texto con textIn
  KT.textInDur = (s, o) => (Array.from(s).length - 1) * (o.stagger == null ? 0.035 : o.stagger) + (o.dur || 0.9);
  // partir en líneas para un ancho máximo
  KT.wrapLines = function (ctx, s, maxW, o) {
    const words = s.split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const test = cur ? cur + ' ' + w : w; if (cur && KT.measure(ctx, test, o) > maxW) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur);
    return lines;
  };
  // ajusta el tamaño para que quepa en maxW
  KT.fit = function (ctx, s, o, maxW, minSize) {
    let size = o.size;
    while (size > (minSize || 10) && KT.measure(ctx, s, Object.assign({}, o, { size })) > maxW) size -= 2;
    return Object.assign({}, o, { size });
  };

  // parte un texto en 1–2 renglones para que quepa en maxW sin bajar de minSize (no lo encoge de más)
  KT.fitLines = function (ctx, s, o, maxW, minSize) {
    if (KT.measure(ctx, s, o) <= maxW) return { lines: [s], o };
    const w = s.split(' ');
    if (w.length > 1) {
      let best = null, bd = 1e9;
      for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '); const d = Math.max(KT.measure(ctx, a, o), KT.measure(ctx, b, o)); if (d < bd) { bd = d; best = [a, b]; } }
      if (bd <= maxW) return { lines: best, o };
      const o2 = KT.fit(ctx, best[0].length > best[1].length ? best[0] : best[1], o, maxW, minSize || 10);
      return { lines: best, o: Object.assign({}, o, { size: Math.min(o2.size, o.size) }) };
    }
    return { lines: [s], o: KT.fit(ctx, s, o, maxW, minSize) };
  };

  /* ---------- Formas ---------- */
  KT.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  };
  // arco (medio punto) como en los vanos del local
  KT.archPath = function (ctx, x, y, w, h) {
    const r = w / 2; ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath();
  };
  // longitud de un path SVG (para revelar trazos con setLineDash)
  const lenCache = new Map();
  KT.pathLen = function (d) {
    let v = lenCache.get(d); if (v != null) return v;
    try { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); v = p.getTotalLength(); } catch (e) { v = 1000; }
    lenCache.set(d, v); return v;
  };
  // dibuja un trazo SVG con progreso p (0→1)
  KT.strokeD = function (ctx, d, p, path2d) {
    if (p <= 0) return;
    const P = path2d || new Path2D(d);
    if (p >= 1) { ctx.setLineDash([]); ctx.stroke(P); return; }
    const L = KT.pathLen(d); ctx.setLineDash([L * p, L * 2]); ctx.lineDashOffset = 0; ctx.stroke(P); ctx.setLineDash([]);
  };

  /* ---------- Texturas (se generan una vez) ---------- */
  const texCache = new Map();
  KT.offscreen = function (w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  // papel: grano fino + fibras. Se pinta sobre un color base.
  KT.paper = function (w, h, base, seed = 1, strength = 1) {
    const key = ['paper', w, h, base, seed, strength].join('|');
    let c = texCache.get(key); if (c) return c;
    c = KT.offscreen(w, h); const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const tile = KT.offscreen(256, 256), tg = tile.getContext('2d'), img = tg.createImageData(256, 256), R = KT.rng(seed);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = R(); const dark = v < 0.5;
      img.data[i] = dark ? 60 : 255; img.data[i + 1] = dark ? 45 : 250; img.data[i + 2] = dark ? 35 : 240;
      img.data[i + 3] = Math.round(Math.abs(v - 0.5) * 2 * 16 * strength);
    }
    tg.putImageData(img, 0, 0);
    g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, w, h);
    g.lineCap = 'round';
    for (let i = 0; i < (w * h) / 9000 * strength; i++) {
      const x = R() * w, y = R() * h, a = R() * TAU, l = 6 + R() * 26;
      g.strokeStyle = R() < 0.5 ? 'rgba(120,90,60,0.07)' : 'rgba(255,255,255,0.18)'; g.lineWidth = 0.6 + R() * 1.1;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (R() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const vg = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.2, w / 2, h * 0.5, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(120,85,55,0.10)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    texCache.set(key, c); return c;
  };
  // sprite genérico cacheado: KT.sprite(key, w, h, draw(g, w, h), {text}) — los que llevan texto no se guardan hasta que cargan las fuentes
  KT.sprite = function (key, w, h, draw, o) {
    let c = texCache.get(key); if (c) return c;
    c = KT.offscreen(w, h); draw(c.getContext('2d'), w, h);
    if (!(o && o.text && !KT._fontsDone)) texCache.set(key, c);
    return c;
  };
  // brillo suave (círculo con degradado) cacheado
  KT.glow = function (color, r) {
    return KT.sprite('glow|' + color + '|' + r, r * 2, r * 2, (g) => {
      const gr = g.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, KT.rgba(color, 0.9)); gr.addColorStop(0.35, KT.rgba(color, 0.35)); gr.addColorStop(1, KT.rgba(color, 0));
      g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    });
  };

  /* ---------- Perlas y burbujas ---------- */
  // perla de tapioca con brillo (sprite por radio redondeado)
  KT.pearl = function (ctx, x, y, r, o = {}) {
    const rr = Math.max(2, Math.round(r)), col = o.color || KT.C.pearl;
    const sp = KT.sprite('pearl|' + rr + '|' + col, rr * 2 + 4, rr * 2 + 4, (g) => {
      const c = rr + 2, gr = g.createRadialGradient(c - rr * 0.35, c - rr * 0.4, rr * 0.1, c, c, rr);
      gr.addColorStop(0, KT.mix(col, '#ffffff', 0.25)); gr.addColorStop(0.55, col); gr.addColorStop(1, KT.mix(col, '#000000', 0.35));
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, rr, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(c - rr * 0.38, c - rr * 0.42, rr * 0.26, rr * 0.18, -0.6, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(c + rr * 0.3, c + rr * 0.35, rr * 0.12, 0, TAU); g.fill();
    });
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    ctx.drawImage(sp, x - rr - 2, y - rr - 2);
    ctx.globalAlpha = a0;
  };
  // perla explosiva (translúcida, de color)
  KT.popPearl = function (ctx, x, y, r, color, o = {}) {
    const rr = Math.max(2, Math.round(r));
    const sp = KT.sprite('pop|' + rr + '|' + color, rr * 2 + 4, rr * 2 + 4, (g) => {
      const c = rr + 2, gr = g.createRadialGradient(c - rr * 0.3, c - rr * 0.35, rr * 0.05, c, c, rr);
      gr.addColorStop(0, KT.mix(color, '#ffffff', 0.7)); gr.addColorStop(0.5, KT.rgba(color, 0.92)); gr.addColorStop(1, KT.rgba(KT.mix(color, '#000000', 0.2), 0.95));
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, rr, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(c - rr * 0.35, c - rr * 0.38, rr * 0.22, rr * 0.14, -0.6, 0, TAU); g.fill();
    });
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    ctx.drawImage(sp, x - rr - 2, y - rr - 2);
    ctx.globalAlpha = a0;
  };
  // cubo de jelly / nata de coco
  KT.jelly = function (ctx, x, y, s, color, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.fillStyle = KT.rgba(color, 0.78); ctx.beginPath(); KT.rr(ctx, -s / 2, -s / 2, s, s, s * 0.22); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); KT.rr(ctx, -s * 0.36, -s * 0.38, s * 0.42, s * 0.16, s * 0.08); ctx.fill();
    ctx.strokeStyle = KT.rgba(KT.mix(color, '#000000', 0.25), 0.35); ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); KT.rr(ctx, -s / 2, -s / 2, s, s, s * 0.22); ctx.stroke();
    ctx.restore();
  };
  // onda concéntrica en el agua (p: 0→1)
  KT.ripple = function (ctx, x, y, p, o = {}) {
    if (p <= 0 || p >= 1) return;
    const R = (o.r || 220) * KT.E.outCubic(p), sq = o.squash || 0.42, rings = o.rings || 3;
    ctx.save(); ctx.lineWidth = o.lw || 3;
    for (let k = 0; k < rings; k++) {
      const rk = R * (1 - k * 0.22); if (rk <= 2) continue;
      ctx.strokeStyle = KT.rgba(o.color || '#ffffff', (o.alpha == null ? 0.5 : o.alpha) * (1 - p) * (1 - k * 0.28));
      ctx.beginPath(); ctx.ellipse(x, y, rk, rk * sq, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------- Pincel y tinta ---------- */
  // trazo de pincel: cinta de ancho variable a lo largo de puntos [{x,y}], p = progreso (0→1)
  // o: {w, color, taperIn, taperOut, dry (0..1 cantidad de cerdas secas), seed, alpha}
  KT.brush = function (ctx, pts, p, o = {}) {
    if (p <= 0 || pts.length < 2) return;
    const n = pts.length, last = Math.max(1, Math.floor((n - 1) * clamp(p)) ), w = o.w || 20;
    const tin = o.taperIn == null ? 0.15 : o.taperIn, tout = o.taperOut == null ? 0.35 : o.taperOut;
    const prof = i => { const u = i / (n - 1); let k = 1; if (u < tin) k = Math.sin((u / tin) * Math.PI / 2); if (u > 1 - tout) k = Math.min(k, Math.max(0.05, (1 - u) / tout)); return k * (o.press ? o.press(u) : 1); };
    const Lp = [], Rp = [];
    for (let i = 0; i <= last; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const hw = (w / 2) * prof(i);
      Lp.push([pts[i].x - ty * hw, pts[i].y + tx * hw]); Rp.push([pts[i].x + ty * hw, pts[i].y - tx * hw]);
    }
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    ctx.fillStyle = o.color || KT.C.ink;
    ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]);
    for (let i = 1; i < Lp.length; i++) ctx.lineTo(Lp[i][0], Lp[i][1]);
    for (let i = Rp.length - 1; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]);
    ctx.closePath(); ctx.fill();
    if (o.dry) { // cerdas secas: líneas finas que se cortan hacia el final
      const R = KT.rng(o.seed || 7); ctx.strokeStyle = o.color || KT.C.ink; ctx.lineCap = 'round';
      const strands = Math.round(6 + o.dry * 10);
      for (let s = 0; s < strands; s++) {
        const off = (R() - 0.5) * 1.1, cut = 0.55 + R() * 0.45; ctx.lineWidth = Math.max(0.8, w * (0.03 + R() * 0.05));
        ctx.beginPath(); let started = false;
        for (let i = 0; i <= last; i++) {
          const u = i / (n - 1); if (u > cut) break;
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
          let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
          const hw = (w / 2) * prof(i) * 1.12, X = pts[i].x - ty * hw * off, Y = pts[i].y + tx * hw * off;
          if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
        }
        ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * a0 * 0.55; ctx.stroke();
      }
    }
    if (o.gaps && o.paper) { // pincel seco: vetas del color del papel en el tramo final del trazo
      const R = KT.rng((o.seed || 7) + 101); ctx.strokeStyle = o.paper; ctx.lineCap = 'round';
      const start = o.gapStart == null ? 0.45 : o.gapStart, nG = Math.round(10 + o.gaps * 16);
      for (let s = 0; s < nG; s++) {
        const off = (R() - 0.5) * 1.6, from = start + R() * (1 - start) * 0.6, lw = Math.max(0.8, w * (0.025 + R() * 0.05));
        ctx.lineWidth = lw; ctx.globalAlpha = a0 * (0.55 + R() * 0.4); ctx.beginPath(); let started = false;
        for (let i = 0; i <= last; i++) {
          const u = i / (n - 1); if (u < from) continue;
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
          let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
          const hw = (w / 2) * prof(i) * 0.95, X = pts[i].x - ty * hw * off, Y = pts[i].y + tx * hw * off;
          if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = a0;
  };
  // puntos de una curva cúbica (para pinceladas)
  KT.cubicPts = function (p0, p1, p2, p3, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push({ x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1] });
    }
    return out;
  };
  // enso: círculo de pincel que se dibuja (p: 0→1)
  KT.enso = function (ctx, x, y, r, p, o = {}) {
    if (p <= 0) return;
    const n = 90, start = o.start == null ? -2.2 : o.start, sweep = o.sweep || TAU * 0.92, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = start + sweep * (i / n), wob = 1 + 0.025 * Math.sin(a * 3 + (o.seed || 0)) + 0.012 * Math.sin(a * 7);
      pts.push({ x: x + Math.cos(a) * r * wob, y: y + Math.sin(a) * r * wob });
    }
    KT.brush(ctx, pts, p, { w: o.w || r * 0.16, color: o.color || KT.C.ink, taperIn: 0.06, taperOut: 0.3, dry: o.dry == null ? 0.6 : o.dry, seed: o.seed || 3, alpha: o.alpha, press: u => 0.75 + 0.35 * Math.sin(u * Math.PI), gaps: o.paper ? (o.gaps == null ? 0.8 : o.gaps) : 0, paper: o.paper, gapStart: 0.5 });
  };
  // mancha de tinta que se expande con borde irregular (p: 0→1)
  KT.inkBloom = function (ctx, x, y, r, p, o = {}) {
    if (p <= 0) return;
    const R = r * KT.E.outCubic(clamp(p)), seed = o.seed || 1, n = 48;
    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      const rr = R * (1 - layer * 0.22);
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * TAU, k = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 7 + seed * 2.1) + 0.04 * Math.sin(a * 13 + seed * 0.7);
        const X = x + Math.cos(a) * rr * k, Y = y + Math.sin(a) * rr * k * (o.squash || 1);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.closePath(); ctx.fillStyle = KT.rgba(o.color || KT.C.ink, (o.alpha == null ? 0.18 : o.alpha) * (0.6 + layer * 0.25)); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- Caligrafía en orden de trazos (datos de KanjiVG en KT.KANJI, ver kanji.js) ---------- */
  // perfil del pincel según el tipo de trazo de KanjiVG: tome (se detiene), harai (barrido), hane (gancho), ten (punto)
  const strokeStyle = type => {
    const t = type || '';
    if (/㇔/.test(t) && !/㇏/.test(t)) return { tin: 0.3, tout: 0.32, press: u => 0.55 + 0.7 * u };
    if (/㇏/.test(t)) return { tin: 0.06, tout: 0.2, press: u => (u < 0.8 ? 0.72 + 0.5 * (u / 0.8) * (u / 0.8) : 1.22) };
    if (/㇒|㇓|㇇|㇋|㇢/.test(t)) return { tin: 0.05, tout: 0.62, press: u => 1.1 - 0.2 * u + 0.3 * Math.exp(-u * 14) };
    if (/㇚|㇁|㇆|㇟|㇙|㇉|㇖|㇗|㇛|㇜/.test(t)) return { tin: 0.05, tout: 0.24, press: u => 0.92 + 0.3 * Math.exp(-u * 14) };
    return { tin: 0.04, tout: 0.08, press: u => 0.88 + 0.32 * Math.exp(-u * 12) + 0.24 * Math.exp(-(1 - u) * 16) };
  };
  const calliCache = {};
  // plan de tiempos: cada trazo dura 0.07 s + 0.0024 s por unidad de largo, con 0.07 s de pausa entre trazos
  KT.calliPlan = function (ch, speed) {
    speed = speed || 1; const key = ch + '|' + speed;
    if (calliCache[key]) return calliCache[key];
    const S = (KT.KANJI || {})[ch]; if (!S) return null;
    let t = 0;
    const strokes = S.map(([type, flat]) => {
      const pts = []; for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] });
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      const d = (0.07 + 0.0024 * len) / speed, st = { pts, type, len, t0: t, d, sty: strokeStyle(type) };
      t += d + 0.07 / speed; return st;
    });
    return (calliCache[key] = { strokes, dur: t - 0.07 / speed });
  };
  KT.calliDur = (ch, speed) => { const P = KT.calliPlan(ch, speed); return P ? P.dur : 0; };
  // escribe ch con pincel, centrado en (x, y) dentro de una caja de size px; lt = segundos desde el primer trazo
  // o: {weight (ancho del pincel / caja), color, alpha, speed, dry, seed}
  KT.calli = function (ctx, ch, x, y, size, lt, o = {}) {
    const P = KT.calliPlan(ch, o.speed); if (!P || lt <= 0) return false;
    const k = size / 109, w = (o.weight || 0.095) * 109;
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(k, k);
    for (let i = 0; i < P.strokes.length; i++) {
      const s = P.strokes[i], p = clamp((lt - s.t0) / s.d); if (p <= 0) break;
      KT.brush(ctx, s.pts, KT.E.ink(p), { w: w * (s.len < 16 ? 1.08 : 1), color: o.color || KT.C.ink, alpha: o.alpha, taperIn: s.sty.tin, taperOut: s.sty.tout, press: s.sty.press, dry: o.dry == null ? 0.25 : o.dry, seed: (o.seed || 3) + i * 7 });
    }
    ctx.restore();
    return true;
  };

  /* ---------- Sello hanko ---------- */
  // sello de piedra: cuadro rojo con el carácter tallado en blanco (hakubun). Si el carácter está en KT.KANJI se
  // talla con sus trazos de ancho uniforme (como una talla); si no, con la fuente de pincel.
  KT.hanko = function (ctx, x, y, size, ch, o = {}) {
    const key = 'hanko|' + size + '|' + ch + '|' + (o.color || KT.C.koi);
    const sp = KT.sprite(key, size + 8, size + 8, (g) => {
      const R = KT.rng(size + ch.charCodeAt(0)); const s = size, c = 4;
      g.fillStyle = o.color || KT.C.koi; g.beginPath();
      const steps = 48, pts = [];
      for (let i = 0; i < steps; i++) { const u = i / steps; let px, py; if (u < 0.25) { px = u * 4 * s; py = 0; } else if (u < 0.5) { px = s; py = (u - 0.25) * 4 * s; } else if (u < 0.75) { px = s - (u - 0.5) * 4 * s; py = s; } else { px = 0; py = s - (u - 0.75) * 4 * s; } pts.push([c + px + (R() - 0.5) * s * 0.03, c + py + (R() - 0.5) * s * 0.03]); }
      pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000';
      const S = (KT.KANJI || {})[ch];
      if (S) {
        // ajusta la caja real de los trazos al 76 % del sello, centrada; trazos de 7.8 % del sello
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        S.forEach(([, f]) => { for (let i = 0; i < f.length; i += 2) { x0 = Math.min(x0, f[i]); x1 = Math.max(x1, f[i]); y0 = Math.min(y0, f[i + 1]); y1 = Math.max(y1, f[i + 1]); } });
        const k = (s * 0.76) / Math.max(x1 - x0, y1 - y0), ox = c + s / 2 - ((x0 + x1) / 2) * k, oy = c + s / 2 - ((y0 + y1) / 2) * k;
        g.lineWidth = s * 0.078; g.lineCap = 'square'; g.lineJoin = 'miter'; g.miterLimit = 3;
        S.forEach(([, flat]) => {
          g.beginPath();
          for (let i = 0; i < flat.length; i += 2) { const X = ox + flat[i] * k + (R() - 0.5) * s * 0.004, Y = oy + flat[i + 1] * k + (R() - 0.5) * s * 0.004; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
          g.stroke();
        });
      } else {
        g.font = `400 ${Math.round(s * 0.72)}px ${KT.F.brush}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(ch, c + s / 2, c + s * 0.53);
      }
      // desgaste de la piedra y del entintado
      for (let i = 0; i < 90; i++) { g.globalAlpha = 0.3 + R() * 0.55; g.beginPath(); g.arc(c + R() * s, c + R() * s, R() * s * 0.016 + 0.5, 0, TAU); g.fill(); }
      for (let i = 0; i < 14; i++) { g.globalAlpha = 0.6; const e = R() * 4 | 0, u = R() * s, r = R() * s * 0.025 + 1; g.beginPath(); g.arc(c + (e === 0 ? u : e === 1 ? s : e === 2 ? u : 0), c + (e === 0 ? 0 : e === 1 ? u : e === 2 ? s : u), r, 0, TAU); g.fill(); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }, { text: true });
    const a0 = ctx.globalAlpha; if (o.alpha != null) ctx.globalAlpha = a0 * o.alpha;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); const sc = o.scale == null ? 1 : o.scale; ctx.scale(sc, sc);
    ctx.drawImage(sp, -(size + 8) / 2, -(size + 8) / 2); ctx.restore();
    ctx.globalAlpha = a0;
  };

  /* ---------- QR real a instagram.com/koitea.mx (generado con segno, corrección M) ---------- */
  KT.QR_IG = ['11111110000011001111001111111','10000010101100111001101000001','10111010010011101001001011101','10111010000111110010001011101','10111010101000100111101011101','10000010000101000011101000001','11111110101010101010101111111','00000000011011101111100000000','10101010010110110101100010010','10111101010000110000111001001','10011011000101000010001010111','01100101100110010110100000010','00000010000110001101111101011','01011100011011011110111001001','00010111110110111000011101011','01111100101111101100001101010','11111111000100111100111101011','00001101000100110100101001101','10100010101011001000101000011','01111000101010010110111011010','10110111111000001101111110000','00000000101011010101100010111','11111110010000101011101011011','10000010000001110111100011001','10111010101100110110111110010','10111010010100101000000110100','10111010111011100101000111001','10000010011111011101110000010','11111110111101111101111000011'];
  // dibuja el QR. o: {dark, light, quiet (módulos de margen), round (0..0.5), reveal (0→1)}
  KT.qr = function (ctx, x, y, size, o = {}) {
    const M = KT.QR_IG, n = M.length, q = o.quiet == null ? 2 : o.quiet, cell = size / (n + q * 2), rr = (o.round || 0) * cell;
    ctx.fillStyle = o.light || '#ffffff'; ctx.beginPath(); KT.rr(ctx, x, y, size, size, o.radius || cell * 1.2); ctx.fill();
    ctx.fillStyle = o.dark || KT.C.ink;
    const reveal = o.reveal == null ? 1 : o.reveal;
    const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (M[r][c] !== '1' || finder(r, c)) continue;
      if (reveal < 1 && KT.hash(r * 97 + c * 13) > reveal) continue;
      const X = x + (q + c) * cell, Y = y + (q + r) * cell;
      if (rr > 0) { ctx.beginPath(); KT.rr(ctx, X + 0.5, Y + 0.5, cell - 1, cell - 1, rr); ctx.fill(); } else ctx.fillRect(X, Y, cell + 0.4, cell + 0.4);
    }
    // ojos del QR (siempre completos para que se lea)
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
      const X = x + (q + c) * cell, Y = y + (q + r) * cell;
      ctx.fillStyle = o.dark || KT.C.ink; ctx.beginPath(); KT.rr(ctx, X, Y, cell * 7, cell * 7, cell * 1.6); ctx.fill();
      ctx.fillStyle = o.light || '#ffffff'; ctx.beginPath(); KT.rr(ctx, X + cell, Y + cell, cell * 5, cell * 5, cell * 1.1); ctx.fill();
      ctx.fillStyle = o.eye || o.dark || KT.C.ink; ctx.beginPath(); KT.rr(ctx, X + cell * 2, Y + cell * 2, cell * 3, cell * 3, cell * 0.9); ctx.fill();
    });
  };

  /* ---------- Íconos de los cubos de luz (línea) ---------- */
  KT.icon = {
    torii(ctx, x, y, s, lw) { // silueta sólida (myōjin): kasagi con las puntas levantadas, shimaki recto, nuki y pilares
      ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.moveTo(-56, -50); ctx.quadraticCurveTo(0, -34, 56, -50); ctx.lineTo(53, -41); ctx.quadraticCurveTo(0, -27, -53, -41); ctx.closePath(); ctx.fill();
      ctx.fillRect(-46, -35, 92, 7);                       // shimaki
      ctx.fillRect(-4, -29, 8, 13);                        // gakuzuka
      ctx.fillRect(-46, -17, 92, 8);                       // nuki
      ctx.beginPath(); ctx.moveTo(-33, -29); ctx.lineTo(-24, -29); ctx.lineTo(-22, 48); ctx.lineTo(-35, 48); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(24, -29); ctx.lineTo(33, -29); ctx.lineTo(35, 48); ctx.lineTo(22, 48); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    boba(ctx, x, y, s, lw) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.lineWidth = lw * 100 / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-30, -22); ctx.lineTo(30, -22); ctx.lineTo(22, 46); ctx.lineTo(-22, 46); ctx.closePath();
      ctx.moveTo(-34, -22); ctx.quadraticCurveTo(0, -42, 34, -22); ctx.moveTo(6, -32); ctx.lineTo(16, -50); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; [[-10, 34], [2, 36], [14, 33], [-4, 24], [9, 23]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, TAU); ctx.fill(); });
      ctx.restore();
    },
    koi(ctx, x, y, s, lw) { // silueta sólida vista desde arriba: cuerpo, aletas pectorales y cola en V
      ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.moveTo(0, -50); ctx.bezierCurveTo(12, -50, 17, -34, 16, -16); ctx.bezierCurveTo(15, 2, 8, 20, 3, 30);
      ctx.lineTo(-3, 30); ctx.bezierCurveTo(-8, 20, -15, 2, -16, -16); ctx.bezierCurveTo(-17, -34, -12, -50, 0, -50); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 24); ctx.bezierCurveTo(-6, 34, -16, 44, -22, 54); ctx.bezierCurveTo(-12, 52, -4, 46, 0, 40); ctx.bezierCurveTo(4, 46, 12, 52, 22, 54); ctx.bezierCurveTo(16, 44, 6, 34, 0, 24); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-14, -22); ctx.bezierCurveTo(-26, -20, -34, -12, -34, -2); ctx.bezierCurveTo(-26, -6, -18, -10, -13, -12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -22); ctx.bezierCurveTo(26, -20, 34, -12, 34, -2); ctx.bezierCurveTo(26, -6, 18, -10, 13, -12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, 8); ctx.bezierCurveTo(-14, 12, -18, 18, -18, 24); ctx.bezierCurveTo(-12, 20, -8, 18, -5, 16); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, 8); ctx.bezierCurveTo(14, 12, 18, 18, 18, 24); ctx.bezierCurveTo(12, 20, 8, 18, 5, 16); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    leaf(ctx, x, y, s, lw) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.lineWidth = lw * 100 / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(0, -46); ctx.moveTo(0, -46); ctx.bezierCurveTo(40, -28, 40, 26, 0, 40); ctx.bezierCurveTo(-40, 26, -40, -28, 0, -46);
      for (let k = 0; k < 4; k++) { const yy = -26 + k * 16; ctx.moveTo(0, yy + 8); ctx.lineTo(18 - k * 2, yy - 4); ctx.moveTo(0, yy + 8); ctx.lineTo(-18 + k * 2, yy - 4); }
      ctx.stroke(); ctx.restore();
    }
  };

  /* ---------- Papel de galería: esquina casi recta, sombra de contacto y filete nogal interior ---------- */
  KT.card = function (ctx, x, y, w, h, a, o = {}) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    if (o.drop) { const [dx, dy, da, dc] = o.drop; ctx.fillStyle = KT.rgba(dc || '#3A2A20', da); ctx.fillRect(x + dx, y + dy, w, h); } // sombra sobre el agua
    ctx.fillStyle = KT.rgba(o.shadow || '#3A2A20', 0.10); ctx.fillRect(x + 3, y + 4, w, h);
    if (o.paper) ctx.drawImage(o.paper, x, y, w, h); else { ctx.fillStyle = o.fill || '#FBF3E8'; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = KT.rgba(KT.C.ink, 0.14); ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    if (o.fillet !== false) { ctx.strokeStyle = KT.rgba(KT.C.walnut, 0.55); ctx.lineWidth = 2; const i = o.inset || 24; ctx.strokeRect(x + i, y + i, w - i * 2, h - i * 2); }
    ctx.restore();
  };
  /* ---------- Precio tipográfico (sin "$"; MXN como etiqueta) ---------- */
  KT.priceBlock = function (ctx, x, y, mxn, o = {}) {
    const a = o.alpha == null ? 1 : o.alpha; if (a <= 0) return;
    const al = o.align || 'left', size = o.size || 140, ink = o.color || KT.C.ink;
    const w = KT.measure(ctx, String(mxn), { size, weight: 600, family: KT.F.sans });
    const x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = KT.rgba(KT.C.walnut, 0.8); ctx.fillRect(x0, y - size * 0.86, Math.max(w, 120) * KT.clamp(o.rule == null ? 1 : o.rule), 3);
    ctx.restore();
    KT.text(ctx, String(mxn), x0, y, { size, weight: 600, family: KT.F.sans, color: ink, alpha: a });
    KT.text(ctx, 'MXN', x0 + 4, y + 56, { size: 44, weight: 600, family: KT.F.sans, color: ink, ls: 6, alpha: a });
    if (o.usd !== false) KT.text(ctx, '≈ ' + KT.money(mxn, 'usd'), x0 + 4, y + 118, { size: 46, weight: 500, family: KT.F.sans, color: KT.C.en, alpha: a });
  };

  /* ---------- Fondo cálido de la pared (para composiciones) ---------- */
  KT.vignette = function (ctx, x, y, w, h, color, a) {
    const key = 'vig|' + w + '|' + h + '|' + color + '|' + a;
    const sp = KT.sprite(key, Math.round(w / 4), Math.round(h / 4), (g, W, H) => {
      const gr = g.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
      gr.addColorStop(0, KT.rgba(color, 0)); gr.addColorStop(1, KT.rgba(color, a)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    ctx.drawImage(sp, x, y, w, h);
  };
})();
