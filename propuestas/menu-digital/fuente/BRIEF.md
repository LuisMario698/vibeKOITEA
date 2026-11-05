# Brief compartido · Menú digital Koi Tea (5 propuestas)

Carpeta de trabajo: `/tmp/claude-0/-home-user-vibeKOITEA/0b3b380c-8320-56fa-bf11-f547c3403f27/scratchpad/koi5/` (en adelante `KOI5/`).
Idioma de todo lo que se entrega: **español de México** (los prototipos también tienen inglés).

## 1. El cliente (hechos confirmados por un estudio previo, 4 nov 2026)

- **Koi Tea Boba Shop**, Puerto Peñasco (Rocky Point), Sonora, México. Abrió el **1 nov 2026**.
- Dirección: C. Benito Juárez 276, Col. José López Portillo, 83550. Horario: 11:00–21:30.
- Instagram **@koitea.mx** (~530 seguidores, 5 publicaciones). Facebook "Koi Tea Boba Shop". Google Maps 5.0★ (2 reseñas).
- Bio: "Ingredientes importados de Taiwán". Frase propia: "el sabor y el arte se unen en un mismo espacio".
- Local: interiorismo **japandi cálido**: madera clara, ratán, blanco cálido, plafón curvo con luz LED cálida, lámparas de globo opal, barra con duela de nogal oscuro y cubierta de cuarzo blanco, celosía de madera, helechos y bonsáis, **arco que enmarca una galería de fotografías** (pagodas, torii), columna de cubos de luz con íconos (torii, vaso de boba, koi, hoja), letras metálicas KOI TEA. Merch propio (playeras, gorras, tote) con "Rocky Point, MX".
- Tapas selladas de los vasos con ilustración tipo tinta y caligrafía.
- Detrás de la barra hay **3 pantallas verticales** con el menú en imagen fija (gris salvia, poco contraste).
- Voz en redes: cálida, agradecida, frases cortas, emojis 🧋 🧡 ✨ 🍃.

## 2. Identidad visual

- **Logo = mascota**: un koi blanco con mancha roja en la cabeza (patrón kohaku), dibujado en **línea negra simple** (aletas, bigotes, aleta dorsal en punta), **bebiendo un boba con popote**; el vaso tiene té con leche y perlas negras. Archivo: `KOI5/img/logo.jpg` (900×900, fondo crema). En las pantallas aparece con el vaso de taro (morado).
- Paleta muestreada (los "≈" son aproximados de fotos):
  - Crema logo `#FEF4EB` · Rojo koi `#F94E2B` · Milk tea `#D0A585` · Trazo `≈#2A2523`
  - Plafón cálido `≈#C39056` · Duela nogal `≈#483D42` · Salvia pantallas `≈#AFC0B6` · Taro `≈#AA81B3`
  - Para texto sobre crema, el rojo koi necesita oscurecerse (`#D9442A` o más oscuro) para cumplir contraste AA.
- Tipografía observada (sin manual de marca): serif itálica de alto contraste en titulares de pósters ("Grand Opening"), sans geométrica en mayúsculas para datos, sans redondeada gruesa para el wordmark "KOI TEA · BOBA SHOP" del merch.
- Fotos reales disponibles (de @koitea.mx), en `KOI5/img/`:
  - `bar.jpg` barra con plafón, lámparas y las 3 pantallas · `cubes.jpg` cubos de luz, letras KOI TEA, celosía
  - `gallery.jpg` arco a la galería y preparación · `merch.jpg` muro de merch · `fruit-teas.jpg` **tres fruit teas** en mesa (degradado rojo→naranja, naranja, rojo con jelly) · `screens.jpg` las 3 pantallas.
  - No existen fotos individuales de cada bebida: los diseños deben verse completos con ilustración y estar listos para fotos reales después.

## 3. Menú actual (transcrito de las pantallas)

- **Milk Tea**: Classic Milk Tea · Brown Sugar Milk Tea · Taro Milk Tea · Strawberry Milk Tea · Mango Milk Tea.
- **Fruit Tea** (té verde): Koi Tea (bebida de la casa; probablemente el degradado rojo→naranja) · Maracuyá Green Tea · Fresa Green Tea · Durazno Green Tea · Mango Green Tea · Lichi Green Tea.
- **Smoothies**: Mango · Fresa · Taro · Maracuyá.
- **Toppings**: Tapioca · Perlas explosivas (lichi, fresa, mango, maracuyá, cereza, coco + 1 ilegible) · Jellys (lichi, fresa, mango, maracuyá, aloe vera, café + 1 ilegible).
- Nota al pie, leída con acercamiento (por confirmar): "*Todas las bebidas incluyen 1 topping gratis".
- **Precios ilegibles** en las fotos → todos los precios de las propuestas son **ilustrativos** y se dice en pantalla.
- Una reseña de Google recomienda "el taro con tapioca o durazno/mango green tea con jelly de lichi".

## 4. Público y contexto

- Puerto Peñasco vive del turismo de **Arizona** (≈1 millón de turistas en 2026, KJZZ). Mucha gente habla inglés y piensa en dólares → **bilingüe ES/EN y precio MXN/USD** son requisitos, no extras.
- Competencia local (Google Maps): Bubble Bee Tea (4.5★, 105 reseñas, el más establecido), BlueMoon Bubble Tea & Coffee (4.8★, 16), Bobalicious Tea (4.4★, 15), Bubble Breeze (5.0★, 1).
- Pedido hoy: en mostrador. Canales posibles: QR en mesa, link en bio de Instagram, pedido para llevar por WhatsApp.

## 5. Quién propone y qué ya vio el cliente

- Quien encarga esto es **Luis Mario** (estudio "VIBE Software"), que vende menús digitales a la medida a negocios de Puerto Peñasco (antes: Bloomé, Claiton Coffee). Su diferenciador frente a OlaClick, Meniu, MENU TIGER, etc.: **diseño a la medida, bilingüe bien hecho y panel de administración incluido**.
- Stack ya recomendado para producción: Next.js + React + TypeScript + Tailwind, Motion/GSAP para animación, Rive/Lottie para la mascota, Supabase (productos, precios, agotados, promos en tiempo real), next-intl, Vercel, pedidos por enlace `wa.me` con mensaje prellenado, PWA, un QR por mesa para medir.
- **Iteración anterior ya presentada** ("Menú Koi Tea", 2 versiones con vaso 3D en Three.js):
  - **A · Estanque**: estanque 3D con koi nadando arriba (tocar el agua los alimenta), lista con recomendados y categorías, ficha que se abre con una onda y vaso 3D que gira y se llena. Era la recomendada como menú principal.
  - **B · Pop**: una bebida a la vez a pantalla completa, fondo del color de la bebida, nombre gigante, vaso 3D al centro, flechas.
  - Las nuevas 5 propuestas deben ser **iteraciones nuevas y distintas** (no copias de A/B), más investigadas y **aplicables** (rápidas, mantenibles, que funcionen en el teléfono de un turista con datos lentos).
- Investigación previa del usuario sobre plataformas (no repetir): OlaClick, Meniu, Parrot, Fudo, MENU TIGER, OddMenu, iMenuPro, IAMenu/MenuLook, Dishtup/Loyverse.

## 6. Las 5 direcciones

El encargo definitivo está en `KOI5/DIRECTIONS.md` (v1 Galería · v2 Armador · v3 Express · v4 Koi guía · v5 Tablero), ajustado con la investigación de `KOI5/RESEARCH.md`. La hipótesis inicial "Linterna" (modo oscuro) se descartó como versión porque la evidencia la contradice para un destino de playa.

## 7. Requisitos comunes de cada prototipo

- Funciona completo dentro de un teléfono (390×844 de referencia; probar 360, 375, 390, 430 de ancho): sin scroll horizontal, sin texto cortado.
- ES/EN y MXN/USD (tipo de cambio de ejemplo 18 MXN = 1 USD, redondeo a 0.25 USD).
- Ver categorías y bebidas, ficha con personalización (tamaño, topping incluido + extras, dulzor, hielo, según aplique), carrito editable, total, y cierre de pedido con dos salidas: **"Mostrar en caja"** (ticket grande con código) y **"Pedir por WhatsApp"** (vista previa del mensaje + copiar; en el prototipo NO navega a wa.me).
- Estados: carrito vacío, búsqueda sin resultados (si hay búsqueda), bebida agotada (al menos una marcada), confirmaciones dentro de la página (nunca `alert/confirm/prompt`).
- Accesible: objetivos táctiles ≥44px, contraste AA, foco visible, `aria-*` en diálogos, Escape cierra, `prefers-reduced-motion` respetado.
- Ligero: sin Three.js; HTML/CSS/JS vanilla; Google Fonts permitido; sin otras peticiones externas.
- Avisos honestos: "Precios ilustrativos", "Prototipo de Luis Mario para Koi Tea".
