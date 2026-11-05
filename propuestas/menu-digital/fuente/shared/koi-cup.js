/* Koi Tea · generador de vasos ilustrados (SVG) por receta.
   API: KoiCup.svg(drink, opts) -> string SVG.
   opts:
     toppings: ['tapioca', ...]  (ids de KOI.toppings; por defecto el topping de la bebida)
     ice: 'none' | 'less' | 'normal'  (por defecto 'normal'; los smoothies no llevan cubos)
     outline: true   trazo de tinta como el logo (false = plano)
     ink: '#2A2523'  color del trazo
     straw: '#E2482B' color del popote (null = sin popote)
     face: false     carita kawaii como la mascota
     shadow: true    sombra bajo el vaso
     mini: false     versión simplificada para miniaturas (menos perlas, trazo más grueso)
     film: true      tapa sellada con el sello koi
     level: 1        0–1 nivel del líquido (para animaciones de llenado)
     label: ''       si se pasa, el SVG lleva role="img" y aria-label; si no, aria-hidden
     className: ''   clase extra para el <svg>
   Capas con clase para animar: .kc-cup .kc-liquid .kc-syrup .kc-ice .kc-tops .kc-film .kc-straw .kc-face .kc-shadow
   Cada perla/jelly lleva style="--i:n" para escalonar animaciones. */
(function () {
  'use strict';
  var n = 0;
  var INK = '#2A2523';

  function rnd(seed) { // pseudoaleatorio determinista por bebida
    var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shade(hex, amt) { // amt -1..1 (negativo oscurece, positivo aclara)
    var h = hex.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    function f(c) { return Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }

  // Geometría del vaso (viewBox 0 0 120 170)
  var TOP_Y = 30, BOT_Y = 160, TL = 17, TR = 103, BL = 31, BR = 89;
  var CUP = 'M' + TL + ' ' + TOP_Y + ' L' + TR + ' ' + TOP_Y + ' L' + (BR + 2) + ' ' + (BOT_Y - 6) + ' Q' + (BR + 1) + ' ' + BOT_Y + ' ' + (BR - 5) + ' ' + BOT_Y + ' L' + (BL + 5) + ' ' + BOT_Y + ' Q' + (BL - 1) + ' ' + BOT_Y + ' ' + (BL - 2) + ' ' + (BOT_Y - 6) + ' Z';
  function xAt(y, side) { // borde interior del vaso a la altura y
    var t = (y - TOP_Y) / (BOT_Y - TOP_Y);
    return side < 0 ? TL + (BL - TL) * t + 2.5 : TR + (BR - TR) * t - 2.5;
  }

  function toppingShapes(list, opts, id, R) {
    var K = window.KOI, out = '', idx = 0;
    if (!list.length) return '';
    var rows = opts.mini ? 2 : 3, per = opts.mini ? 4 : 6, total = rows * per;
    for (var row = 0; row < rows; row++) {
      var y = BOT_Y - 9 - row * (opts.mini ? 11 : 9.5);
      var x0 = xAt(y, -1) + 6, x1 = xAt(y, 1) - 6;
      var count = per - (row === rows - 1 ? 1 : 0);
      for (var i = 0; i < count; i++) {
        var tp = K && K.topping(list[idx % list.length]);
        var type = tp ? tp.type : 'tapioca', col = tp ? tp.color : '#3A2214';
        var x = x0 + (count === 1 ? (x1 - x0) / 2 : (x1 - x0) * i / (count - 1)) + (R() - 0.5) * 3;
        var yy = y + (R() - 0.5) * 3, k = idx;
        if (type === 'jelly') {
          var w = opts.mini ? 9 : 8, rot = Math.round((R() - 0.5) * 50);
          out += '<rect class="kc-top kc-jelly" style="--i:' + k + '" x="' + (x - w / 2).toFixed(1) + '" y="' + (yy - w / 2).toFixed(1) + '" width="' + w + '" height="' + w + '" rx="2" fill="' + col + '" fill-opacity=".86" stroke="' + shade(col, -0.25) + '" stroke-opacity=".55" stroke-width=".8" transform="rotate(' + rot + ' ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ')"/>';
        } else if (type === 'pop') {
          var r = opts.mini ? 5 : 4.6;
          out += '<g class="kc-top kc-pop" style="--i:' + k + '"><circle cx="' + x.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="' + r + '" fill="' + col + '" fill-opacity=".92" stroke="' + shade(col, -0.3) + '" stroke-opacity=".5" stroke-width=".8"/><circle cx="' + (x - r * 0.35).toFixed(1) + '" cy="' + (yy - r * 0.38).toFixed(1) + '" r="' + (r * 0.32).toFixed(1) + '" fill="#fff" fill-opacity=".8"/></g>';
        } else {
          var r2 = opts.mini ? 5.4 : 5;
          out += '<g class="kc-top kc-tapioca" style="--i:' + k + '"><circle cx="' + x.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="' + r2 + '" fill="' + col + '"/><circle cx="' + (x - r2 * 0.35).toFixed(1) + '" cy="' + (yy - r2 * 0.4).toFixed(1) + '" r="' + (r2 * 0.28).toFixed(1) + '" fill="#fff" fill-opacity=".35"/></g>';
        }
        idx++;
        if (idx >= total) break;
      }
    }
    return out;
  }

  function svg(d, opts) {
    opts = opts || {};
    var K = window.KOI;
    var id = 'kc' + (++n);
    var R = rnd(d.id || 'x');
    var outline = opts.outline !== false, ink = opts.ink || INK;
    var sw = opts.mini ? 3.2 : 2.4;
    var tops = opts.toppings || (d.topping ? [d.topping] : []);
    var iceId = d.kind === 'smooth' ? 'none' : (opts.ice || 'normal');
    var cubes = K && K.iceLevel(iceId) ? K.iceLevel(iceId).cubes : 0;
    if (opts.mini || opts.face) cubes = Math.min(cubes, 2);
    var level = opts.level == null ? 1 : Math.max(0, Math.min(1, opts.level));
    var liqTop = 40 + (1 - level) * (BOT_Y - 44);
    var c = d.colors || {};
    var defs = '<clipPath id="' + id + 'c"><path d="' + CUP + '"/></clipPath>';
    var liquidFill;
    if (d.kind === 'fruit') {
      defs += '<linearGradient id="' + id + 'g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + c.bottom + '"/><stop offset=".34" stop-color="' + c.bottom + '"/><stop offset=".62" stop-color="' + c.top + '"/><stop offset="1" stop-color="' + shade(c.top, 0.18) + '"/></linearGradient>';
      liquidFill = 'url(#' + id + 'g)';
    } else if (d.kind === 'smooth') {
      defs += '<linearGradient id="' + id + 'g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + shade(c.liquid, -0.06) + '"/><stop offset=".8" stop-color="' + c.liquid + '"/><stop offset="1" stop-color="' + (c.top || shade(c.liquid, 0.3)) + '"/></linearGradient>';
      liquidFill = 'url(#' + id + 'g)';
    } else {
      defs += '<linearGradient id="' + id + 'g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + shade(c.liquid, -0.1) + '"/><stop offset=".85" stop-color="' + c.liquid + '"/><stop offset="1" stop-color="' + (c.top || shade(c.liquid, 0.35)) + '"/></linearGradient>';
      liquidFill = 'url(#' + id + 'g)';
    }
    var label = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true" focusable="false"';
    var s = '<svg class="koi-cup ' + (opts.className || '') + '" viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg"' + label + '><defs>' + defs + '</defs>';

    if (opts.shadow !== false) s += '<ellipse class="kc-shadow" cx="60" cy="164" rx="32" ry="4.2" fill="' + ink + '" fill-opacity=".14"/>';

    // vaso: fondo translúcido
    s += '<g class="kc-cup"><path d="' + CUP + '" fill="#FFFFFF" fill-opacity=".55"/></g>';

    // interior recortado
    s += '<g clip-path="url(#' + id + 'c)">';
    s += '<rect class="kc-liquid" x="0" y="' + liqTop.toFixed(1) + '" width="120" height="' + (BOT_Y - liqTop + 4).toFixed(1) + '" fill="' + liquidFill + '"/>';
    if (d.kind === 'brown' && c.syrup) { // rayas de tigre del jarabe
      var stripes = '';
      for (var i = 0; i < 6; i++) {
        var sx = 20 + i * 16 + (R() - 0.5) * 6, wv = 5 + R() * 6;
        stripes += '<path d="M' + sx.toFixed(1) + ' ' + (liqTop + 4).toFixed(1) + ' C' + (sx + wv).toFixed(1) + ' ' + (liqTop + 40).toFixed(1) + ' ' + (sx - wv).toFixed(1) + ' 110 ' + (sx + wv * 0.6).toFixed(1) + ' ' + BOT_Y + '" stroke="' + c.syrup + '" stroke-width="' + (opts.mini ? 6 : 4.5 + R() * 3).toFixed(1) + '" stroke-linecap="round" fill="none" stroke-opacity="' + (0.55 + R() * 0.3).toFixed(2) + '"/>';
      }
      s += '<g class="kc-syrup">' + stripes + '</g>';
      s += '<rect x="0" y="' + (BOT_Y - 26) + '" width="120" height="30" fill="' + c.syrup + '" fill-opacity=".55"/>';
    }
    if (d.kind === 'smooth' && !opts.mini) { // textura escarchada
      var fr = '';
      for (var j = 0; j < 26; j++) fr += '<circle cx="' + (22 + R() * 76).toFixed(1) + '" cy="' + (liqTop + 6 + R() * 90).toFixed(1) + '" r="' + (0.7 + R() * 1.3).toFixed(1) + '" fill="#fff" fill-opacity="' + (0.25 + R() * 0.35).toFixed(2) + '"/>';
      s += '<g class="kc-frost">' + fr + '</g>';
    }
    if (d.kind === 'fruit' && !opts.mini) { // burbujas
      var bb = '';
      for (var b = 0; b < 12; b++) bb += '<circle cx="' + (24 + R() * 72).toFixed(1) + '" cy="' + (liqTop + 8 + R() * 70).toFixed(1) + '" r="' + (0.8 + R() * 1.4).toFixed(1) + '" fill="#fff" fill-opacity="' + (0.25 + R() * 0.3).toFixed(2) + '"/>';
      s += '<g class="kc-bubbles">' + bb + '</g>';
    }
    // hielo
    var iceS = '';
    for (var q = 0; q < cubes; q++) {
      var qy = liqTop + 6 + q * 12 + (R() - 0.5) * 4, qx = 30 + ((q * 37) % 52) + (R() - 0.5) * 6, qw = opts.mini ? 15 : 14, qr = Math.round((R() - 0.5) * 30);
      iceS += '<rect style="--i:' + q + '" x="' + qx.toFixed(1) + '" y="' + qy.toFixed(1) + '" width="' + qw + '" height="' + qw + '" rx="3" fill="#FFFFFF" fill-opacity=".42" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="1" transform="rotate(' + qr + ' ' + (qx + qw / 2).toFixed(1) + ' ' + (qy + qw / 2).toFixed(1) + ')"/>';
    }
    s += '<g class="kc-ice">' + iceS + '</g>';
    // toppings
    s += '<g class="kc-tops">' + toppingShapes(tops, opts, id, R) + '</g>';
    // brillo del vaso
    s += '<path d="M' + (TL + 9) + ' ' + (TOP_Y + 8) + ' L' + (BL + 4) + ' ' + (BOT_Y - 14) + '" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="' + (opts.mini ? 4 : 3.5) + '" stroke-linecap="round"/>';
    s += '</g>';

    // carita
    // popote (entra por la tapa)
    if (opts.straw !== null) {
      var stc = opts.straw || '#E2482B';
      s += '<g class="kc-straw"><path d="M67 ' + (BOT_Y - 30) + ' L79 4" stroke="' + (outline ? ink : shade(stc, -0.25)) + '" stroke-width="' + (opts.mini ? 11 : 10) + '" stroke-linecap="round"/><path d="M67 ' + (BOT_Y - 30) + ' L79 4" stroke="' + stc + '" stroke-width="' + (opts.mini ? 6.5 : 6) + '" stroke-linecap="round"/></g>';
    }

    if (opts.face) {
      var fy = Math.max(liqTop + 30, 88), ex = opts.mini ? 15 : 14, er = opts.mini ? 5 : 4.4;
      s += '<g class="kc-face">' +
        '<ellipse cx="' + (60 - ex) + '" cy="' + fy + '" rx="' + er + '" ry="' + (er * 1.2).toFixed(1) + '" fill="' + ink + '"/>' +
        '<ellipse cx="' + (60 + ex) + '" cy="' + fy + '" rx="' + er + '" ry="' + (er * 1.2).toFixed(1) + '" fill="' + ink + '"/>' +
        '<circle cx="' + (60 - ex - 1.4) + '" cy="' + (fy - 2) + '" r="1.5" fill="#fff"/><circle cx="' + (60 + ex - 1.4) + '" cy="' + (fy - 2) + '" r="1.5" fill="#fff"/>' +
        '<ellipse cx="' + (60 - ex - 9) + '" cy="' + (fy + 9) + '" rx="6.5" ry="3.4" fill="#F38BA0" fill-opacity=".75"/><ellipse cx="' + (60 + ex + 9) + '" cy="' + (fy + 9) + '" rx="6.5" ry="3.4" fill="#F38BA0" fill-opacity=".75"/>' +
        '<path d="M53 ' + (fy + 7) + ' Q60 ' + (fy + 14) + ' 67 ' + (fy + 7) + '" stroke="' + ink + '" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>';
    }

    // contorno del vaso
    if (outline) s += '<path d="' + CUP + '" fill="none" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';

    // tapa sellada
    if (opts.film !== false) {
      s += '<g class="kc-film"><ellipse cx="60" cy="' + TOP_Y + '" rx="44" ry="6" fill="#FFF8F0"' + (outline ? ' stroke="' + ink + '" stroke-width="' + sw + '"' : ' stroke="' + shade('#FFF8F0', -0.12) + '" stroke-width="1"') + '/>';
      if (!opts.mini) s += '<path d="M44 ' + (TOP_Y + 1) + ' q8 -3 16 0 t16 0" stroke="' + ink + '" stroke-opacity=".55" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="50" cy="' + (TOP_Y - 1.5) + '" r="2.2" fill="#F94E2B"/>';
      s += '</g>';
      // el popote atraviesa la tapa: repinta el tramo superior
      if (opts.straw !== null) {
        var stc2 = opts.straw || '#E2482B';
        var sy = TOP_Y - 1, sx0 = (67 + 12 * ((BOT_Y - 30) - sy) / ((BOT_Y - 30) - 4)).toFixed(1);
        s += '<path class="kc-straw-top" d="M' + sx0 + ' ' + sy + ' L79 4" stroke="' + (outline ? ink : shade(stc2, -0.25)) + '" stroke-width="' + (opts.mini ? 11 : 10) + '" stroke-linecap="round"/><path class="kc-straw-top" d="M' + sx0 + ' ' + sy + ' L79 4" stroke="' + stc2 + '" stroke-width="' + (opts.mini ? 6.5 : 6) + '" stroke-linecap="round"/>';
      }
    }
    s += '</svg>';
    return s;
  }

  window.KoiCup = { svg: svg, shade: shade };
})();
