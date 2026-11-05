# Módulos compartidos (KOI5/shared)

Cada versión es UN archivo HTML completo en `KOI5/vN.html` (con `<!doctype html>`, `<head>`, `<body>`).
Carga los módulos EXACTAMENTE así (el ensamblador los incrusta buscando este formato literal):

```html
<script src="shared/koi-data.js"></script>
<script src="shared/koi-cup.js"></script>
```

Imágenes con ruta relativa `img/…` (p. ej. `img/logo.jpg`). Nada de rutas `../`, nada de otros archivos locales.

## window.KOI (koi-data.js)

Datos:
- `KOI.meta`: name, fullName, city, cityEn, tagline{es,en}, origin{es,en}, address, hours, instagram, instagramUrl, whatsapp (null = por confirmar), rate (18), freeToppings (1), extraToppingPrice (15), maxToppings (3), pricesNote{es,en}, allergenNote{es,en}, protoNote{es,en}, logo, photos{bar,cubes,gallery,merch,fruitTeas,screens}.
- `KOI.categories`: [{id:'milk'|'fruit'|'smooth', es, en, descEs, descEn, options:{size,sweet,ice,toppings}}]. **Los smoothies no tienen dulzor ni hielo** (options.sweet=false, options.ice=false): no muestres esos controles para ellos.
- `KOI.drinks` (15): {id, cat, name, nameEn, es, en, price (MXN), kind:'milk'|'brown'|'fruit'|'smooth', colors:{main, liquid|bottom/top, top, syrup?}, topping (id por defecto), tags:['casa'|'resena'|'clasico'], caffeine, milk, profile:{dulce,cremoso,frutal,te,fresco} 0–5, soldOut?}.
  - `koi` es la bebida de la casa (tag 'casa'). `taro`, `durazno-green`, `mango-green` tienen tag 'resena' (recomendadas en una reseña real de Google; dilo así, no inventes "más vendido").
  - `smooth-maracuya` está **agotada** (soldOut:true) para demostrar ese estado.
- `KOI.toppings` (13): {id, group:'tapioca'|'pops'|'jelly', es, en, shortEs, shortEn, color, type:'tapioca'|'pop'|'jelly', soldOut?}. `pop-cereza` está agotado.
- `KOI.toppingGroups`, `KOI.sizes` ([{id:'regular' Mediano/Medium +0}, {id:'grande' Grande/Large +15}]), `KOI.sweetness` (5 niveles: 0 Sin azúcar · 30 Poco · 50 Mitad · 70 Menos · 100 Normal / No sugar · Light · Half · Less · Regular), `KOI.ice` ([{id:'none'|'less'|'normal', es, en, cubes}]), `KOI.defaults` ({size:'regular', sweet:100, ice:'normal'}).

Funciones (todas puras; el carrito es un arreglo inmutable que tú guardas):
- `KOI.drink(id)`, `KOI.topping(id)`, `KOI.category(id)`, `KOI.size(id)`, `KOI.iceLevel(id)`
- `KOI.drinkName(d, lang)`, `KOI.drinkDesc(d, lang)`, `KOI.catName(c, lang)`, `KOI.toppingName(t, lang, short)`, `KOI.sweetLabel(v, lang)`
- `KOI.optionsFor(d)` → {size, sweet, ice, toppings}
- `KOI.defaultConfig(d)` → `{size:'regular', sweet:100|null, ice:'normal'|null, toppings:[d.topping]}` (cfg = configuración de una bebida)
- `KOI.unitPrice(d, cfg)` → MXN: base + tamaño + 15 por cada topping después del primero (el primero va incluido). Máximo `KOI.meta.maxToppings` toppings: **tú** limitas la selección.
- `KOI.conv(mxn, cur)` (cur 'mxn'|'usd'; USD redondeado a 0.25), `KOI.money(valor, cur, style)`, `KOI.fmt(mxn, cur, style)` con style 'short' ("$85" / "US$4.75"), 'full' ("$85 MXN" / "US$4.75"), 'bare' ("85" / "4.75").
- Carrito: `KOI.addToCart(lines, id, cfg, qty)` → nuevo arreglo (fusiona líneas idénticas por `key`); `KOI.setQty(lines, key, qty)` (qty 0 elimina); `KOI.lineTotal(line, cur)`; `KOI.cartTotal(lines, cur)` (se cobra en MXN: el total en USD se convierte DESDE el total en MXN, así que puede no ser la suma exacta de las líneas en USD; muestra los montos en USD con "≈"); `KOI.cartCount(lines)`.
- `KOI.toppingPriceLabel(index, lang, cur)` → 'Incluido'/'Included' para el primer topping elegido y '+$15'/'+US$0.75' para los demás: muéstralo junto a cada topping seleccionado (regla visible, como recomiendan las cadenas).
- `KOI.describe(d, cfg, lang)` → "Grande · Tapioca + Jelly de lichi · Dulzor 50% · Poco hielo".
- `KOI.orderCode()` → "K-H362" (genera uno al cerrar el pedido, no en cada render).
- `KOI.waMessage(lines, lang, cur, code, name, time)` → texto del mensaje para el personal: código primero, líneas en MXN, total en MXN con ≈USD si el cliente usa USD o inglés, línea "(ES)" con la receta en español si la interfaz está en inglés, y "Pago en caja"; `KOI.waLink(msg)` → URL wa.me (en el prototipo NO navegues: muestra el mensaje, botón Copiar con `navigator.clipboard.writeText` dentro del click y `catch` que seleccione el texto; aclara "En producción esto abre WhatsApp").
- `KOI.recommend({dulce, cremoso, frutal, te, fresco}, n)` → bebidas más cercanas al perfil (excluye agotadas).
- `KOI.drinksIn(catId)` → bebidas de la categoría (incluye agotadas, márcalas).

## window.KoiCup (koi-cup.js)

`KoiCup.svg(drink, opts)` → string SVG (viewBox 0 0 120 170, vaso con tapa sellada y popote, al estilo de línea del logo).
opts: `toppings` (ids; por defecto el de la bebida), `ice` ('none'|'less'|'normal'; los smoothies nunca llevan cubos), `outline` (true), `ink` ('#2A2523'), `straw` ('#E2482B'; null = sin popote), `face` (false; carita kawaii), `shadow` (true), `mini` (false; para miniaturas < 64px), `film` (true), `level` (0–1), `label` (texto accesible; sin label el SVG es aria-hidden), `className`.
Capas animables por clase: `.kc-cup .kc-liquid .kc-syrup .kc-frost .kc-bubbles .kc-ice .kc-tops .kc-top .kc-face .kc-straw .kc-straw-top .kc-film .kc-shadow`; cada topping lleva `style="--i:n"` para escalonar.
Dale tamaño con CSS al `<svg>` (p. ej. `width:100%;height:auto` o una altura fija). `KoiCup.shade(hex, amt)` aclara/oscurece colores.
Puedes envolver o estilizar el SVG a tu gusto; si tu concepto pide otra ilustración, puedes dibujar la tuya, pero mantén los colores de `drink.colors`.
