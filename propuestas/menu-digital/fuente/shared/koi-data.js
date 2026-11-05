/* Koi Tea · datos compartidos del menú y lógica de pedido.
   Fuente del menú: pantallas del local (foto @koitea.mx, 1 nov 2026). Precios y tamaños ILUSTRATIVOS.
   API global: window.KOI  (sin dependencias). */
(function () {
  'use strict';

  var meta = {
    name: 'Koi Tea',
    fullName: 'Koi Tea Boba Shop',
    city: 'Puerto Peñasco, Sonora',
    cityEn: 'Rocky Point, Sonora',
    tagline: { es: 'El sabor y el arte se unen en un mismo espacio', en: 'Where flavor and art share one space' },
    origin: { es: 'Ingredientes importados de Taiwán', en: 'Ingredients imported from Taiwan' },
    address: 'C. Benito Juárez 276, Col. José López Portillo, 83550, Puerto Peñasco, Son.',
    hours: '11:00 – 21:30',
    instagram: '@koitea.mx',
    instagramUrl: 'https://www.instagram.com/koitea.mx/',
    whatsapp: null, // número por confirmar con el negocio
    rate: 18, // MXN por 1 USD (tipo de cambio de ejemplo)
    freeToppings: 1, // "Todas las bebidas incluyen 1 topping gratis" (leído en la pantalla, por confirmar)
    extraToppingPrice: 15, // MXN por topping adicional (ilustrativo)
    maxToppings: 3,
    pricesNote: { es: 'Precios y tamaños ilustrativos, por confirmar con Koi Tea.', en: 'Illustrative prices and sizes, to be confirmed by Koi Tea.' },
    allergenNote: { es: 'Ingredientes y alérgenos por confirmar con Koi Tea.', en: 'Ingredients and allergens to be confirmed by Koi Tea.' },
    protoNote: { es: 'Prototipo de Luis Mario para Koi Tea.', en: 'Prototype by Luis Mario for Koi Tea.' },
    logo: 'img/logo.jpg',
    photos: {
      bar: 'img/bar.jpg', cubes: 'img/cubes.jpg', gallery: 'img/gallery.jpg',
      merch: 'img/merch.jpg', fruitTeas: 'img/fruit-teas.jpg', screens: 'img/screens.jpg'
    }
  };

  var categories = [
    { id: 'milk', es: 'Milk Tea', en: 'Milk Tea',
      descEs: 'Té negro de Taiwán con leche.', descEn: 'Taiwanese black tea with milk.',
      options: { size: true, sweet: true, ice: true, toppings: true } },
    { id: 'fruit', es: 'Fruit Tea', en: 'Fruit Tea',
      descEs: 'Té verde con fruta, sin leche.', descEn: 'Green tea with fruit, no milk.',
      options: { size: true, sweet: true, ice: true, toppings: true } },
    { id: 'smooth', es: 'Smoothies', en: 'Smoothies',
      descEs: 'Frappé cremoso, sin té.', descEn: 'Creamy blended drink, no tea.',
      options: { size: true, sweet: false, ice: false, toppings: true } }
  ];

  /* kind: milk | brown | fruit | smooth
     colors.main = color dominante (fondos, chips); liquid/top/bottom/syrup = para el vaso.
     profile 0–5: dulce, cremoso, frutal, te (intensidad de té), fresco.
     tags: casa (bebida de la casa), resena (recomendada en reseña real de Google), clasico. */
  var drinks = [
    { id: 'classic', cat: 'milk', name: 'Classic Milk Tea', nameEn: 'Classic Milk Tea',
      es: 'Té negro de Taiwán con leche: suave, tostado y balanceado. El clásico para empezar.',
      en: 'Taiwanese black tea with milk: smooth, toasty and balanced. The classic to start with.',
      price: 85, kind: 'milk', colors: { main: '#C9A27E', liquid: '#C9A27E', top: '#E6D2BA' },
      topping: 'tapioca', tags: ['clasico'], caffeine: true, milk: true,
      profile: { dulce: 3, cremoso: 4, frutal: 0, te: 4, fresco: 2 } },
    { id: 'brown-sugar', cat: 'milk', name: 'Brown Sugar Milk Tea', nameEn: 'Brown Sugar Milk Tea',
      es: 'Té con leche y jarabe de azúcar morena que baja por el vaso en rayas. Dulce y acaramelado.',
      en: 'Milk tea with brown sugar syrup streaking down the cup. Sweet and caramel-like.',
      price: 95, kind: 'brown', colors: { main: '#8A5230', liquid: '#E8D6BF', top: '#F3E7D6', syrup: '#6B3A1E' },
      topping: 'tapioca', tags: [], caffeine: true, milk: true,
      profile: { dulce: 5, cremoso: 4, frutal: 0, te: 2, fresco: 1 } },
    { id: 'taro', cat: 'milk', name: 'Taro Milk Tea', nameEn: 'Taro Milk Tea',
      es: 'Cremoso y suave, con raíz de taro. Una reseña lo recomienda con tapioca.',
      en: 'Creamy and mellow, made with taro root. A reviewer recommends it with tapioca.',
      price: 90, kind: 'milk', colors: { main: '#A985C8', liquid: '#B99AD3', top: '#DCCBEA' },
      topping: 'tapioca', tags: ['resena'], caffeine: true, milk: true,
      profile: { dulce: 4, cremoso: 5, frutal: 0, te: 2, fresco: 1 } },
    { id: 'strawberry-milk', cat: 'milk', name: 'Strawberry Milk Tea', nameEn: 'Strawberry Milk Tea',
      es: 'Té con leche y fresa: rosado, suave y afrutado.',
      en: 'Milk tea with strawberry: pink, smooth and fruity.',
      price: 90, kind: 'milk', colors: { main: '#E98A9C', liquid: '#F2B3BE', top: '#F9DCE1' },
      topping: 'pop-fresa', tags: [], caffeine: true, milk: true,
      profile: { dulce: 4, cremoso: 4, frutal: 3, te: 2, fresco: 2 } },
    { id: 'mango-milk', cat: 'milk', name: 'Mango Milk Tea', nameEn: 'Mango Milk Tea',
      es: 'Té con leche y mango maduro. Cremoso con un toque tropical.',
      en: 'Milk tea with ripe mango. Creamy with a tropical touch.',
      price: 90, kind: 'milk', colors: { main: '#EDB04A', liquid: '#F3C46B', top: '#F9E2B0' },
      topping: 'pop-mango', tags: [], caffeine: true, milk: true,
      profile: { dulce: 4, cremoso: 4, frutal: 3, te: 2, fresco: 2 } },

    { id: 'koi', cat: 'fruit', name: 'Koi Tea', nameEn: 'Koi Tea',
      es: 'La bebida de la casa, en capas de rojo a naranja como un koi. Frutal y refrescante.',
      en: 'Our house signature, layered red to orange like a koi. Fruity and refreshing.',
      price: 95, kind: 'fruit', colors: { main: '#E2482B', bottom: '#D7263D', top: '#F39A2B' },
      topping: 'jelly-lichi', tags: ['casa'], caffeine: true, milk: false,
      profile: { dulce: 3, cremoso: 0, frutal: 5, te: 2, fresco: 5 } },
    { id: 'maracuya-green', cat: 'fruit', name: 'Maracuyá Green Tea', nameEn: 'Passion Fruit Green Tea',
      es: 'Té verde con maracuyá: ácido, tropical y muy fresco.',
      en: 'Green tea with passion fruit: tangy, tropical and very fresh.',
      price: 85, kind: 'fruit', colors: { main: '#EBA21F', bottom: '#E8920F', top: '#F6D365' },
      topping: 'pop-maracuya', tags: [], caffeine: true, milk: false,
      profile: { dulce: 2, cremoso: 0, frutal: 5, te: 3, fresco: 5 } },
    { id: 'fresa-green', cat: 'fruit', name: 'Fresa Green Tea', nameEn: 'Strawberry Green Tea',
      es: 'Té verde con fresa, dulce y ligero.',
      en: 'Green tea with strawberry, sweet and light.',
      price: 85, kind: 'fruit', colors: { main: '#DA3B52', bottom: '#D3233F', top: '#F28C96' },
      topping: 'jelly-fresa', tags: [], caffeine: true, milk: false,
      profile: { dulce: 3, cremoso: 0, frutal: 5, te: 3, fresco: 4 } },
    { id: 'durazno-green', cat: 'fruit', name: 'Durazno Green Tea', nameEn: 'Peach Green Tea',
      es: 'Té verde con durazno. Una reseña lo recomienda con jelly de lichi.',
      en: 'Green tea with peach. A reviewer recommends it with lychee jelly.',
      price: 85, kind: 'fruit', colors: { main: '#F08A3C', bottom: '#EE7B30', top: '#F9C27A' },
      topping: 'jelly-lichi', tags: ['resena'], caffeine: true, milk: false,
      profile: { dulce: 3, cremoso: 0, frutal: 4, te: 3, fresco: 5 } },
    { id: 'mango-green', cat: 'fruit', name: 'Mango Green Tea', nameEn: 'Mango Green Tea',
      es: 'Té verde con mango. Una reseña lo recomienda con jelly de lichi.',
      en: 'Green tea with mango. A reviewer recommends it with lychee jelly.',
      price: 85, kind: 'fruit', colors: { main: '#F2A12A', bottom: '#F29A1D', top: '#F9D063' },
      topping: 'jelly-lichi', tags: ['resena'], caffeine: true, milk: false,
      profile: { dulce: 3, cremoso: 0, frutal: 5, te: 3, fresco: 5 } },
    { id: 'lichi-green', cat: 'fruit', name: 'Lichi Green Tea', nameEn: 'Lychee Green Tea',
      es: 'Té verde con lichi, floral y delicado.',
      en: 'Green tea with lychee, floral and delicate.',
      price: 85, kind: 'fruit', colors: { main: '#E9A3A6', bottom: '#EFB9BB', top: '#FBE9E4' },
      topping: 'pop-lichi', tags: [], caffeine: true, milk: false,
      profile: { dulce: 3, cremoso: 0, frutal: 4, te: 3, fresco: 5 } },

    { id: 'smooth-mango', cat: 'smooth', name: 'Smoothie de Mango', nameEn: 'Mango Smoothie',
      es: 'Frappé cremoso de mango, espeso y frío.',
      en: 'Creamy blended mango, thick and icy.',
      price: 90, kind: 'smooth', colors: { main: '#F2AE2E', liquid: '#F6B93B', top: '#FBD98A' },
      topping: 'tapioca', tags: [], caffeine: false, milk: true,
      profile: { dulce: 4, cremoso: 5, frutal: 4, te: 0, fresco: 4 } },
    { id: 'smooth-fresa', cat: 'smooth', name: 'Smoothie de Fresa', nameEn: 'Strawberry Smoothie',
      es: 'Frappé cremoso de fresa.',
      en: 'Creamy blended strawberry.',
      price: 90, kind: 'smooth', colors: { main: '#E45C6E', liquid: '#EC6A7A', top: '#F6B2BB' },
      topping: 'pop-fresa', tags: [], caffeine: false, milk: true,
      profile: { dulce: 4, cremoso: 5, frutal: 4, te: 0, fresco: 4 } },
    { id: 'smooth-taro', cat: 'smooth', name: 'Smoothie de Taro', nameEn: 'Taro Smoothie',
      es: 'Frappé cremoso de taro, suave y dulce.',
      en: 'Creamy blended taro, mellow and sweet.',
      price: 90, kind: 'smooth', colors: { main: '#A985C8', liquid: '#B99AD3', top: '#DCCBEA' },
      topping: 'tapioca', tags: [], caffeine: false, milk: true,
      profile: { dulce: 4, cremoso: 5, frutal: 1, te: 0, fresco: 3 } },
    { id: 'smooth-maracuya', cat: 'smooth', name: 'Smoothie de Maracuyá', nameEn: 'Passion Fruit Smoothie',
      es: 'Frappé cremoso de maracuyá, ácido y tropical.',
      en: 'Creamy blended passion fruit, tangy and tropical.',
      price: 90, kind: 'smooth', colors: { main: '#EAA126', liquid: '#F2B53C', top: '#F9DA8E' },
      topping: 'pop-maracuya', tags: [], caffeine: false, milk: true, soldOut: true,
      profile: { dulce: 3, cremoso: 5, frutal: 5, te: 0, fresco: 4 } }
  ];

  var toppingGroups = [
    { id: 'tapioca', es: 'Tapioca', en: 'Tapioca' },
    { id: 'pops', es: 'Perlas explosivas', en: 'Popping boba' },
    { id: 'jelly', es: 'Jellys', en: 'Jellies' }
  ];

  /* type: tapioca | pop | jelly (define cómo se dibuja). short = nombre corto para chips. */
  var toppings = [
    { id: 'tapioca', group: 'tapioca', es: 'Tapioca', en: 'Tapioca pearls', shortEs: 'Tapioca', shortEn: 'Tapioca', color: '#3A2214', type: 'tapioca' },
    { id: 'pop-lichi', group: 'pops', es: 'Perlas explosivas de lichi', en: 'Lychee popping boba', shortEs: 'Perlas de lichi', shortEn: 'Lychee pops', color: '#F3DCD7', type: 'pop' },
    { id: 'pop-fresa', group: 'pops', es: 'Perlas explosivas de fresa', en: 'Strawberry popping boba', shortEs: 'Perlas de fresa', shortEn: 'Strawberry pops', color: '#E23A4F', type: 'pop' },
    { id: 'pop-mango', group: 'pops', es: 'Perlas explosivas de mango', en: 'Mango popping boba', shortEs: 'Perlas de mango', shortEn: 'Mango pops', color: '#F5A21B', type: 'pop' },
    { id: 'pop-maracuya', group: 'pops', es: 'Perlas explosivas de maracuyá', en: 'Passion fruit popping boba', shortEs: 'Perlas de maracuyá', shortEn: 'Passion fruit pops', color: '#F2C12E', type: 'pop' },
    { id: 'pop-cereza', group: 'pops', es: 'Perlas explosivas de cereza', en: 'Cherry popping boba', shortEs: 'Perlas de cereza', shortEn: 'Cherry pops', color: '#B0132D', type: 'pop', soldOut: true },
    { id: 'pop-coco', group: 'pops', es: 'Perlas explosivas de coco', en: 'Coconut popping boba', shortEs: 'Perlas de coco', shortEn: 'Coconut pops', color: '#F2EEE6', type: 'pop' },
    { id: 'jelly-lichi', group: 'jelly', es: 'Jelly de lichi', en: 'Lychee jelly', shortEs: 'Jelly de lichi', shortEn: 'Lychee jelly', color: '#EFE8DC', type: 'jelly' },
    { id: 'jelly-fresa', group: 'jelly', es: 'Jelly de fresa', en: 'Strawberry jelly', shortEs: 'Jelly de fresa', shortEn: 'Strawberry jelly', color: '#F07C8C', type: 'jelly' },
    { id: 'jelly-mango', group: 'jelly', es: 'Jelly de mango', en: 'Mango jelly', shortEs: 'Jelly de mango', shortEn: 'Mango jelly', color: '#F6B53A', type: 'jelly' },
    { id: 'jelly-maracuya', group: 'jelly', es: 'Jelly de maracuyá', en: 'Passion fruit jelly', shortEs: 'Jelly de maracuyá', shortEn: 'Passion fruit jelly', color: '#F3C443', type: 'jelly' },
    { id: 'jelly-aloe', group: 'jelly', es: 'Aloe vera', en: 'Aloe vera', shortEs: 'Aloe vera', shortEn: 'Aloe vera', color: '#D6EBC4', type: 'jelly' },
    { id: 'jelly-cafe', group: 'jelly', es: 'Jelly de café', en: 'Coffee jelly', shortEs: 'Jelly de café', shortEn: 'Coffee jelly', color: '#5B3A27', type: 'jelly' }
  ];

  /* Dos tamaños con su precio, como CHAGEE (Regular/Large) y KOI (M/L). Medidas reales por confirmar. */
  var sizes = [
    { id: 'regular', es: 'Mediano', en: 'Medium', delta: 0 },
    { id: 'grande', es: 'Grande', en: 'Large', delta: 15 }
  ];

  /* Escala de 5 niveles usada por cadenas como CoCo (100/70/50/30/0) y Gong cha (5 palabras). */
  var sweetness = [
    { v: 0, es: 'Sin azúcar', en: 'No sugar' },
    { v: 30, es: 'Poco', en: 'Light' },
    { v: 50, es: 'Mitad', en: 'Half' },
    { v: 70, es: 'Menos', en: 'Less' },
    { v: 100, es: 'Normal', en: 'Regular' }
  ];

  var ice = [
    { id: 'none', es: 'Sin hielo', en: 'No ice', cubes: 0 },
    { id: 'less', es: 'Poco hielo', en: 'Light ice', cubes: 2 },
    { id: 'normal', es: 'Hielo normal', en: 'Regular ice', cubes: 4 }
  ];

  var defaults = { size: 'regular', sweet: 100, ice: 'normal' };

  /* ---------- utilidades ---------- */
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function drink(id) { return byId(drinks, id); }
  function topping(id) { return byId(toppings, id); }
  function category(id) { return byId(categories, id); }
  function size(id) { return byId(sizes, id); }
  function iceLevel(id) { return byId(ice, id); }
  function L(lang) { return lang === 'en' ? 'en' : 'es'; }
  function drinkName(d, lang) { return L(lang) === 'en' ? (d.nameEn || d.name) : d.name; }
  function drinkDesc(d, lang) { return L(lang) === 'en' ? d.en : d.es; }
  function catName(c, lang) { return L(lang) === 'en' ? c.en : c.es; }
  function toppingName(t, lang, short) {
    if (!t) return '';
    if (short) return L(lang) === 'en' ? t.shortEn : t.shortEs;
    return L(lang) === 'en' ? t.en : t.es;
  }
  function sweetLabel(v, lang) {
    for (var i = 0; i < sweetness.length; i++) if (sweetness[i].v === v) return v + '% · ' + sweetness[i][L(lang)];
    return v + '%';
  }
  /* Etiqueta de precio de un topping según su posición en la selección: el primero va incluido. */
  function toppingPriceLabel(index, lang, cur) {
    if (index < meta.freeToppings) return L(lang) === 'en' ? 'Included' : 'Incluido';
    return '+' + fmt(meta.extraToppingPrice, cur || 'mxn');
  }
  function optionsFor(d) { var c = category(d.cat); return c ? c.options : { size: true, sweet: true, ice: true, toppings: true }; }

  /* Configuración inicial de una bebida (lo que la barra preparía si no dices nada). */
  function defaultConfig(d) {
    var o = optionsFor(d), tp = topping(d.topping);
    return {
      size: defaults.size,
      sweet: o.sweet ? defaults.sweet : null,
      ice: o.ice ? defaults.ice : null,
      toppings: (o.toppings && tp && !tp.soldOut) ? [d.topping] : []
    };
  }

  /* Precio unitario en MXN: base + tamaño + toppings extra (el primero va incluido). */
  function unitPrice(d, cfg) {
    cfg = cfg || defaultConfig(d);
    var s = size(cfg.size), extra = Math.max(0, (cfg.toppings || []).length - meta.freeToppings);
    return d.price + (s ? s.delta : 0) + extra * meta.extraToppingPrice;
  }

  /* Conversión a la moneda elegida. USD redondeado a 0.25. Devuelve número. */
  function conv(mxn, cur) {
    if (cur === 'usd') return Math.round((mxn / meta.rate) * 4) / 4;
    return mxn;
  }
  /* Formato: style 'full' -> "$85 MXN" / "US$4.75"; 'short' -> "$85" / "US$4.75"; 'bare' -> "85" / "4.75". */
  function money(value, cur, style) {
    style = style || 'short';
    if (cur === 'usd') {
      var u = value.toFixed(2);
      return style === 'bare' ? u : 'US$' + u;
    }
    var m = String(Math.round(value));
    if (style === 'bare') return m;
    return style === 'full' ? '$' + m + ' MXN' : '$' + m;
  }
  /* Atajo: precio en MXN -> texto en la moneda elegida. */
  function fmt(mxn, cur, style) { return money(conv(mxn, cur), cur, style); }

  /* Carrito: lista de líneas {key, id, cfg, qty}. Totales coherentes: suma de líneas ya convertidas. */
  function lineKey(id, cfg) {
    return [id, cfg.size, cfg.sweet, cfg.ice, (cfg.toppings || []).slice().sort().join('+')].join('|');
  }
  function lineTotal(line, cur) {
    var d = drink(line.id); if (!d) return 0;
    return conv(unitPrice(d, line.cfg), cur) * line.qty;
  }
  /* Total: se cobra en MXN; el USD es una referencia calculada desde el total en MXN
     (no sumando líneas ya redondeadas, que acumula error). */
  function cartTotal(lines, cur) {
    var t = 0; for (var i = 0; i < lines.length; i++) t += lineTotal(lines[i], 'mxn');
    return cur === 'usd' ? conv(t, 'usd') : t;
  }
  function cartCount(lines) { var n = 0; for (var i = 0; i < lines.length; i++) n += lines[i].qty; return n; }

  /* Agrega al carrito fusionando líneas idénticas. Devuelve un arreglo nuevo. */
  function addToCart(lines, id, cfg, qty) {
    var key = lineKey(id, cfg), out = lines.map(function (l) { return { key: l.key, id: l.id, cfg: l.cfg, qty: l.qty }; });
    for (var i = 0; i < out.length; i++) if (out[i].key === key) { out[i].qty += (qty || 1); return out; }
    out.push({ key: key, id: id, cfg: JSON.parse(JSON.stringify(cfg)), qty: qty || 1 });
    return out;
  }
  function setQty(lines, key, qty) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (l.key === key) { if (qty > 0) out.push({ key: l.key, id: l.id, cfg: l.cfg, qty: qty }); }
      else out.push(l);
    }
    return out;
  }

  /* Resumen legible de una configuración. */
  function describe(d, cfg, lang) {
    var o = optionsFor(d), parts = [], en = L(lang) === 'en';
    var s = size(cfg.size); if (o.size && s) parts.push(s[L(lang)]);
    var tps = (cfg.toppings || []).map(function (id) { return toppingName(topping(id), lang, true); });
    if (o.toppings) parts.push(tps.length ? tps.join(' + ') : (en ? 'No topping' : 'Sin topping'));
    if (o.sweet && cfg.sweet != null) parts.push((en ? 'Sugar ' : 'Dulzor ') + cfg.sweet + '%');
    if (o.ice && cfg.ice) { var ic = iceLevel(cfg.ice); if (ic) parts.push(ic[L(lang)]); }
    return parts.join(' · ');
  }

  /* Código de pedido corto y legible para mostrar en caja (sin 0/O ni 1/I). */
  function orderCode() {
    var A = 'ACDEFHJKMNPRTUVWXY', N = '23456789', s = 'K-';
    s += A.charAt(Math.floor(Math.random() * A.length));
    for (var i = 0; i < 3; i++) s += N.charAt(Math.floor(Math.random() * N.length));
    return s;
  }

  /* Mensaje de WhatsApp para pedido para llevar. name y time opcionales.
     Estructura (McDonald's/Baymard/WhatsApp click-to-chat): saludo → código → líneas → total con equivalente → nombre → hora → pago en caja. */
  function waMessage(lines, lang, cur, code, name, time) {
    var en = L(lang) === 'en', out = [];
    out.push(en ? "Hi Koi Tea! 🧋 I'd like to order for pickup." : '¡Hola, Koi Tea! 🧋 Quiero pedir para recoger.');
    if (code) out.push((en ? 'Order ' : 'Pedido ') + code);
    out.push('');
    lines.forEach(function (l) {
      var d = drink(l.id); if (!d) return;
      out.push(l.qty + '× ' + drinkName(d, lang) + ' — ' + money(lineTotal(l, 'mxn'), 'mxn', 'full'));
      out.push('   ' + describe(d, l.cfg, lang));
      if (en) out.push('   (ES) ' + describe(d, l.cfg, 'es')); // la barra lee en español
    });
    out.push('');
    // Para el personal: el total real en MXN; si el cliente usa USD o inglés, el equivalente aproximado.
    out.push('Total: ' + money(cartTotal(lines, 'mxn'), 'mxn', 'full') + ((cur === 'usd' || en) ? ' (≈ ' + money(cartTotal(lines, 'usd'), 'usd', 'full') + ')' : ''));
    if (name) out.push((en ? 'Name: ' : 'Nombre: ') + name);
    if (time) out.push((en ? 'Pickup time: ' : 'Hora para recoger: ') + time);
    out.push(en ? "I'll pay at the counter." : 'Pago en caja al recoger.');
    return out.join('\n');
  }
  /* Enlace wa.me para producción (en el prototipo no se navega). */
  function waLink(message) {
    var num = meta.whatsapp ? String(meta.whatsapp).replace(/\D/g, '') : '';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(message);
  }

  /* Recomendación por perfil (para quizzes/filtros). want: {dulce, cremoso, frutal, te, fresco} 0–5 (los que falten no cuentan). */
  function recommend(want, n, opts) {
    opts = opts || {};
    var keys = ['dulce', 'cremoso', 'frutal', 'te', 'fresco'];
    var scored = drinks.filter(function (d) { return opts.includeSoldOut || !d.soldOut; }).map(function (d) {
      var dist = 0, used = 0;
      keys.forEach(function (k) { if (want[k] != null) { var diff = d.profile[k] - want[k]; dist += diff * diff; used++; } });
      return { d: d, score: used ? Math.sqrt(dist / used) : 0 };
    });
    scored.sort(function (a, b) { return a.score - b.score || a.d.price - b.d.price; });
    return scored.slice(0, n || 3).map(function (x) { return x.d; });
  }

  function drinksIn(catId, opts) {
    opts = opts || {};
    return drinks.filter(function (d) { return d.cat === catId && (opts.includeSoldOut !== false || !d.soldOut); });
  }

  window.KOI = {
    meta: meta, categories: categories, drinks: drinks, toppings: toppings, toppingGroups: toppingGroups,
    sizes: sizes, sweetness: sweetness, ice: ice, defaults: defaults,
    drink: drink, topping: topping, category: category, size: size, iceLevel: iceLevel,
    drinkName: drinkName, drinkDesc: drinkDesc, catName: catName, toppingName: toppingName, sweetLabel: sweetLabel, toppingPriceLabel: toppingPriceLabel,
    optionsFor: optionsFor, defaultConfig: defaultConfig, unitPrice: unitPrice,
    conv: conv, money: money, fmt: fmt,
    lineKey: lineKey, lineTotal: lineTotal, cartTotal: cartTotal, cartCount: cartCount, addToCart: addToCart, setQty: setQty,
    describe: describe, orderCode: orderCode, waMessage: waMessage, waLink: waLink,
    recommend: recommend, drinksIn: drinksIn
  };
})();
