/* Menú de Koi Tea leído de las pantallas actuales. Precios ILUSTRATIVOS (los mismos de la propuesta de menú digital),
   por confirmar con el negocio. Tipo de cambio de ejemplo: $18 MXN por dólar. */
(function () {
  'use strict';
  const KT = window.KT;
  KT.RATE = 18;
  KT.money = (mxn, cur) => (cur === 'usd' ? 'US$' + (Math.round((mxn / KT.RATE) * 4) / 4).toFixed(2) : '$' + mxn);
  const D = (n, en, p, k, c1, c2, extra) => Object.assign({ n, en, p, k, c1, c2: c2 || c1, layers: [[0, c1], [1, c2 || c1]] }, extra || {});
  KT.MENU = {
    milk: {
      es: 'Milk Tea', en: 'Milk Tea', sub: 'Té con leche', subEn: 'Milk tea',
      items: [
        D('Classic Milk Tea', 'Classic Milk Tea', 85, 'milk', '#C9A27E', '#D9B794', { top: { type: 'tapioca' } }),
        D('Brown Sugar Milk Tea', 'Brown Sugar Milk Tea', 95, 'brown', '#EAD7BE', '#F1E3CF', { c2: '#5A2E14', layers: [[0, '#B9875C'], [0.35, '#E3CBAA'], [1, '#F1E3CF']], top: { type: 'tapioca' }, star: true }),
        D('Taro Milk Tea', 'Taro Milk Tea', 90, 'milk', '#B79AD0', '#C9B1DE', { top: { type: 'tapioca' }, star: true }),
        D('Strawberry Milk Tea', 'Strawberry Milk Tea', 90, 'milk', '#F2B5C0', '#F7CCD3', { top: { type: 'pop', color: '#E3304C' } }),
        D('Mango Milk Tea', 'Mango Milk Tea', 90, 'milk', '#F4C46A', '#F7D894', { top: { type: 'pop', color: '#F5AE1E' } })
      ]
    },
    fruit: {
      es: 'Fruit Tea', en: 'Fruit Tea', sub: 'Té verde con fruta', subEn: 'Green tea with fruit',
      items: [
        D('Koi Tea', 'Koi Tea', 95, 'fruit', '#D8283F', '#F39A2B', { layers: [[0, '#C81E3A'], [0.32, '#D8283F'], [0.55, '#F07A2E'], [1, '#F6B048']], top: { type: 'jelly', color: '#F2ECE2' }, star: true, house: true }),
        D('Maracuyá Green Tea', 'Passion Fruit Green Tea', 85, 'fruit', '#E99417', '#F7D46B', { top: { type: 'pop', color: '#F2B33A' } }),
        D('Fresa Green Tea', 'Strawberry Green Tea', 85, 'fruit', '#D72A45', '#F2848A', { top: { type: 'pop', color: '#E3304C' } }),
        D('Durazno Green Tea', 'Peach Green Tea', 85, 'fruit', '#EE7F2A', '#F8BE68', { top: { type: 'jelly', color: '#F4DCD6' }, star: true }),
        D('Mango Green Tea', 'Mango Green Tea', 85, 'fruit', '#F2A01E', '#F8CE5E', { top: { type: 'pop', color: '#F5AE1E' } }),
        D('Lichi Green Tea', 'Lychee Green Tea', 85, 'fruit', '#F1C2C0', '#FBEDE8', { top: { type: 'jelly', color: '#F2ECE2' } })
      ]
    },
    smooth: {
      es: 'Smoothies', en: 'Smoothies', sub: 'Frappé de fruta', subEn: 'Blended fruit',
      items: [
        D('Mango', 'Mango', 90, 'smooth', '#F6B93B', '#F8C95E'),
        D('Fresa', 'Strawberry', 90, 'smooth', '#EC6A7A', '#F08C98'),
        D('Taro', 'Taro', 90, 'smooth', '#B79AD0', '#C7AFDD'),
        D('Maracuyá', 'Passion Fruit', 90, 'smooth', '#F2B53C', '#F6C95E')
      ]
    },
    toppings: {
      es: 'Toppings', en: 'Toppings',
      tapioca: { es: 'Tapioca', en: 'Tapioca pearls' },
      pops: { es: 'Perlas explosivas', en: 'Popping pearls', flavors: ['Lichi', 'Fresa', 'Mango', 'Maracuyá', 'Cereza', 'Coco'], flavorsEn: ['Lychee', 'Strawberry', 'Mango', 'Passion fruit', 'Cherry', 'Coconut'], colors: ['#F4DCD6', '#E3304C', '#F5AE1E', '#F2B33A', '#B5172F', '#F6F1E7'] },
      jellys: { es: 'Jellys', en: 'Jellies', flavors: ['Lichi', 'Fresa', 'Mango', 'Maracuyá', 'Aloe vera', 'Café'], flavorsEn: ['Lychee', 'Strawberry', 'Mango', 'Passion fruit', 'Aloe vera', 'Coffee'], colors: ['#F2ECE2', '#EE8A98', '#F7C35A', '#F3BE4E', '#D7EDC6', '#5B3A28'] },
      note: 'Todas las bebidas incluyen 1 topping', noteEn: 'Every drink includes 1 topping'
    },
    info: {
      ig: '@koitea.mx', hours: '11:00 – 21:30', address: 'C. Benito Juárez 276', city: 'Puerto Peñasco · Rocky Point',
      tagline: 'El sabor y el arte se unen en un mismo espacio', taglineEn: 'Where flavor meets art',
      origin: 'Ingredientes importados de Taiwán', originEn: 'Ingredients imported from Taiwan'
    }
  };
  KT.drink = name => {
    for (const k of ['milk', 'fruit', 'smooth']) { const f = KT.MENU[k].items.find(d => d.n === name); if (f) return f; }
    return null;
  };
})();
