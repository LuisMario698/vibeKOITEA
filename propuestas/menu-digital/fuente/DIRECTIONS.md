# Las 5 direcciones (encargo de diseño)

Las cinco comparten datos (shared/koi-data.js), el vaso de línea (shared/koi-cup.js), requisitos (SPEC.md) y la investigación (RESEARCH.md). Lo que cambia es el **paradigma de navegación**, la **identidad visual** y el **rasgo distintivo**. Cada una expresa una faceta real de la marca. Ninguna repite A·Estanque (estanque 3D + lista) ni B·Pop (un cartel por bebida con el fondo pintado del color de la bebida y flechas). Todas abren directo al menú o a una pantalla con salida inmediata al menú (sin registro). Paletas verificadas con contraste AA para los pares de texto indicados.

Reglas visuales para todas (de la investigación): el vaso de línea es la firma; nada de 3D; nada de kanji decorativo; el color de cada bebida tiñe halos, chips y transiciones, nunca toda la pantalla; vidrio esmerilado solo en barras fijas con fondo ≥0.85 de opacidad y respaldo sólido; rojo koi vivo `#F94E2B` solo en ilustración o bloques grandes, nunca en texto chico; "Recomendado en reseñas" solo para taro, durazno-green y mango-green; "De la casa" para koi.

---

## v1 · Galería — "Sabor y arte"

**Una línea:** el menú como catálogo de exposición: cada bebida es una pieza con su cédula, y siempre se puede pedir desde la cédula.
**Faceta de marca:** la frase propia de Koi Tea ("el sabor y el arte se unen en un mismo espacio") y el arco con la galería de fotos del local. Japandi tranquilo.
**Investigación que la respalda:** Matcha Cartel (Mención Honorífica Awwwards, jun 2026: archivo con tarjetas de historia), Cha.ology y CHAGEE (patrimonio convertido en sistema propio), The Alley (marca refinada de línea), tendencia editorial 2026. Ajuste pedido por la investigación: la galería no puede frenar el pedido → **precio y botón "+" en cada cédula**.
**Paradigma:** recorrido vertical por *salas* (Sala I · Milk Tea, Sala II · Fruit Tea, Sala III · Smoothies, y un "Gabinete de toppings") con un índice fijo tipo plano de sala que marca la sala actual. Cada sala abre con una **obra destacada** (Koi Tea en Fruit Tea; Taro en Milk Tea; el smoothie de mango en Smoothies) en formato grande, y sigue con las demás piezas en muro.
**Pantallas:**
1. Entrada: foto `img/gallery.jpg` (el arco real) dentro de una **máscara de arco**; "Koi Tea · Colección permanente", la frase de la marca y "Puerto Peñasco · Rocky Point"; ES/EN y MXN/USD arriba; "Entrar a la colección" (`go-menu`) o desplazar.
2. Salas con encabezado: numeral romano en versalitas, nombre en serif itálica grande, una línea curatorial. Piezas numeradas "N.º 01 … 15" (`drink-<id>` en la pieza).
3. **Cédula** (convención de museo, en este orden): Título en español en serif itálica · nombre en inglés en sans en mayúsculas espaciadas (en EN se invierte la jerarquía) · *Técnica:* base · fruta/leche · topping sugerido (p. ej. "Té verde · durazno · jelly de lichi") · una frase · placas pequeñas ("De la casa", "Recomendado en reseñas", "Agotado") · precio en mono · botón "+" (`quick-add-<id>`, agrega con la receta sugerida) y "Ver pieza".
4. Ficha de obra (pantalla completa, transición de "acercarse al cuadro"): vaso grande en máscara de arco sobre muro, cédula completa, y la personalización en un formulario sobrio de líneas finas (Tamaño, Topping, Dulzor, Hielo) con precio vivo y "Agregar · $120".
5. "Tu selección" (carrito) como hoja sobria.
6. Ticket "Mostrar en caja" como **boleto de museo**: talón con perforación, código grande, fecha y hora, sello rojo tipo hanko con el koi. WhatsApp con el mismo lenguaje.
**Rasgo distintivo:** iluminación de galería: la pieza que queda al centro de la pantalla "se enciende" (haz cálido desde arriba como el riel de spots del local, con IntersectionObserver y CSS), las demás quedan en penumbra suave; más el boleto de museo como cierre.
**Paleta:** muro `#FAF7F2` (fondo), tinta `#1F1B19` (texto 16:1), piedra `#6A5F57` (secundario 5.8:1), roble `#C8A27A` (marcos, filetes; no texto), nogal `#2A2523` (bandas oscuras, texto crema), rojo sello `#B33A22` (sellos y acentos de texto 5.5:1), luz `#FFE9C7` (haz/resplandor).
**Tipografía:** *Instrument Serif* (itálica, display; como los pósters "Grand Opening") + *Schibsted Grotesk* (UI, cédulas, nombres EN en versalitas) + *IBM Plex Mono* (números de pieza, precios, datos).
**Ilustración:** `KoiCup.svg` con contorno de tinta dentro de un marco fino de roble con passe-partout, o dentro de la máscara de arco en la ficha. Patrón opcional: líneas verticales finas tipo celosía en el muro. `bar.jpg` en el pie "Visítanos".
**Movimiento:** lento y preciso (fundidos, la luz que sube, acercamiento a la ficha). Nada de rebotes.
**Evitar:** textos curatoriales largos (1 línea por sala, 1 frase por pieza), crema+serif+terracota genérico (aquí el muro es blanco de galería y el rojo es un sello), que la metáfora esconda el precio.

---

## v2 · Armador — "Arma tu boba"

**Una línea:** el vaso es la interfaz: eliges y lo ves llenarse en vivo.
**Faceta de marca:** el producto y el ritual de la barra (tapioca, perlas explosivas, jellys, dulzor e hielo), con ingredientes de Taiwán; la mascota bebiendo boba.
**Investigación que la respalda:** las cadenas comparten las mismas 4–5 variables; Gong cha USA explica dulzor e hielo con diagramas de vaso; Shenzhen Bubble Milktea (logo que indica azúcar, hielo y temperatura); kioscos de Xing Fu Tang (selección en tiempo real). Ajuste pedido: **no forzar un asistente de 5 pantallas** (Kung Fu Tea redujo pasos y pantallas) → una sola pantalla con el vaso fijo y secciones ancladas, valores por defecto y atajo "Pedir así".
**Paradigma:** configurador en una pantalla: vaso grande fijo arriba (≈40% de la altura) con nombre y precio vivos; debajo, secciones ancladas en el orden de la barra: **1 Base** (Milk Tea / Fruit Tea / Smoothie) → **2 Sabor** → **3 Toppings** → **4 Dulzor y hielo** (se oculta en smoothies) → **5 Tamaño y cantidad**. Chips de pasos tocables que desplazan a cada sección y muestran ✓ cuando ya hay elección; botón "Agregar · $X" siempre visible abajo.
**Pantallas:**
1. Inicio: "¿Qué se te antoja hoy?" + 3 **favoritos de la casa** que abren el armador ya lleno (Koi Tea; Taro con tapioca — reseña; Durazno Green Tea con jelly de lichi — reseña), "Armar desde cero" y "Ver menú completo" (lista compacta con las 15; `drink-<id>` abre el armador en esa bebida). ES/EN y MXN/USD.
2. Armador (descrito arriba). Sabor como swatches circulares con el color de la bebida; toppings como gotas "gummy" translúcidas (perlas, jellys) y tapioca mate, agrupadas (Tapioca · Perlas explosivas · Jellys), con "Incluido"/"+$15" según orden de elección; dulzor como 5 niveles con palabra y %, y un medidor de jarabe junto al vaso; hielo como 0/2/4 cubos.
3. Carrito como hoja con mini-vasos de cada receta; cierre en caja (ticket con el vaso armado) y WhatsApp.
**Rasgo distintivo:** animación de receta: el líquido cambia de color con transición, el nivel sube, las perlas caen una por una con rebote (usa `--i` de `.kc-top`), los cubos de hielo entran o salen, el medidor de dulzor sube; al agregar, la tapa se sella y el vaso vuela al carrito. Todo con transform/opacity, y en reduced motion, cambios instantáneos con fundido.
**Paleta:** crema logo `#FEF4EB` (fondo), tinta `#2A2523` (texto y trazos 13.9:1), rojo koi oscuro `#C2361C` (botón principal con texto blanco 5.5:1), rojo vivo `#F94E2B` (solo ilustración), miel `#F6D9A8` (superficies de opciones; texto tinta 11:1), taro `#7A5BA6` (estado seleccionado secundario; texto blanco 5.4:1). Milk tea `#D0A585` solo decorativo.
**Tipografía:** *Rubik* (600–800 display, 400–500 cuerpo; esquinas suaves, robusta, con números claros). Sin otras familias salvo para números si hace falta.
**Ilustración:** `KoiCup.svg` grande con contorno (estilo del logo), sin carita.
**Movimiento:** juguetón pero rápido (200–450 ms), física de caída en perlas.
**Evitar:** pasos obligatorios, parecerse a B·Pop (aquí no hay carrusel de carteles: es una herramienta), vasos con cara.

---

## v3 · Express — "Rápido y bilingüe"

**Una línea:** pedir en tres toques, en tu idioma y tu moneda.
**Faceta de marca:** el turista de Arizona en la fila y el cajero del local; servicio claro y amable.
**Investigación que la respalda:** tiendas de Uber Eats/DoorDash/Rappi (destacados, pestañas por serie, "+" rápido), Gong cha México (nombre en inglés + descriptor en español), kioscos bilingües de Mixue, "Repetir pedido" de Kung Fu Tea y CHAGEE. Ajuste pedido: **darle identidad** para que no parezca plantilla de delivery → portada "Hoy en Koi" en bento sobre la retícula de la celosía, el vaso-indicador y micro-estados del koi.
**Paradigma:** tienda de app de delivery: encabezado compacto, **"Hoy en Koi"** (bento de 4–5 tiles: Koi Tea de la casa grande con su degradado; Recomendados en reseñas; "¿Primera vez? Qué es el boba"; Toppings; Merch "Rocky Point, MX"), luego pestañas de categoría fijas que siguen el scroll, filas con mini-vaso + nombre + descripción corta + precio + botón "+" (`quick-add-<id>`, agrega la receta por defecto con un toque y deja "Personalizar" en la hoja), barra inferior del carrito, ficha como hoja inferior.
**Pantallas:**
1. Menú: cabecera con logo, "Abierto · 11:00–21:30", toggles grandes ES/EN y MXN/USD; "Hoy en Koi"; filtros en chips (Con leche, Sin leche, Sin cafeína, Recomendado en reseñas) y búsqueda por sabor (fresa, mango, taro…) con estado "sin resultados" diseñado (con el koi) y botón para limpiar.
2. Glosario "¿Qué es el boba? / What is boba?": tapioca, perlas explosivas, jelly, dulzor %, hielo, con mini-dibujos (íconos de proceso que no dependen del idioma).
3. Hoja de bebida: todo en una pantalla, controles segmentados compactos, botón "Agregar · $120".
4. Carrito con edición rápida y "Repetir mi último pedido" (localStorage opcional).
5. **Ticket bilingüe para caja**: con la interfaz en inglés, cada línea va en inglés y debajo en español "Para el personal"; código enorme; total en la moneda elegida y en MXN.
6. Info: dirección, horario, Instagram, nota de tipo de cambio de referencia (ilustrativo).
**Rasgo distintivo:** velocidad y claridad (agregar desde la lista con un toque y animación mínima hacia la barra del carrito), el glosario para primerizos y el ticket bilingüe pensado para el personal.
**Paleta:** blanco `#FFFFFF` y crema `#FEF4EB` (superficies), tinta `#1E1A18` (texto 17:1), gris `#5E554F` (secundario 7.3:1), salvia `#DCE5DF` (tiles y chips; viene de las pantallas del local; texto `#2F4A3F` 7.5:1), rojo koi `#C2361C` (botones con texto blanco 5.5:1; precios `#B5321B` 6.1:1).
**Tipografía:** *Figtree* (UI y cuerpo, números tabulares) + *Zen Maru Gothic* 700 (títulos cortos y wordmark redondeado como el merch).
**Ilustración:** `KoiCup.svg` en modo `mini` en filas (56–64 px), normal en la hoja; koi del logo en estados vacíos.
**Movimiento:** mínimo y funcional (150–250 ms).
**Evitar:** look de plantilla (los detalles de Koi Tea hacen la diferencia), glass con texto encima, más de 5 tiles.

---

## v4 · Koi guía — "Pregúntale al koi"

**Una línea:** la mascota te recibe, te hace tres preguntas y te recomienda tu boba; si ya sabes qué quieres, un toque y estás en el menú.
**Faceta de marca:** la mascota (un personaje que ya hace el trabajo de marca) y la voz cálida de redes.
**Investigación que la respalda:** "era del comportamiento" de las mascotas (Creative Bloq), Snow King de Mixue (momento foto, pop-ups), BLOOP (mascota con estados), The Alley (animal de línea refinado). Ajustes pedidos: **guía opcional de 3 preguntas** con salida "Ver menú" en todo momento; **koi de línea fina, sin volverlo chibi ni kawaii genérico**; stickers solo como insignias; tarjeta para compartir 9:16 con "Rocky Point, MX".
**Paradigma:** conversación guiada + menú. Arranca con el koi saludando en una burbuja: "¿Primera vez en Koi Tea?" → "Ayúdame a elegir" (quiz) / "Ya sé qué quiero" (`go-menu`).
**Pantallas:**
1. Saludo: koi grande en **SVG propio dibujado al estilo del logo** (koi blanco con mancha roja kohaku, línea negra, aleta dorsal en punta, aletas laterales y bigotes, bebiendo boba con popote) con 5–6 estados ligados a eventos: saluda (inicio), piensa (durante el quiz), celebra (resultado / agregar), triste (bebida agotada), duerme (fuera de horario, si aplica), sorprendido (búsqueda sin resultados o carrito vacío). Parpadeo y aletas con CSS.
2. Quiz de 3 preguntas, opciones grandes ilustradas: ¿Cremoso o frutal? · ¿Qué tan dulce? (5 niveles con palabras) · ¿Qué textura? (tapioca masticable / perlas que explotan / jelly suave / sin topping). Progreso con burbujas. "Ver menú" siempre visible.
3. Resultado: "Tu boba es…" 1 principal + 2 alternativas (`KOI.recommend`), cada una con el topping que corresponde a la textura y el dulzor elegido, botón agregar directo; **tarjeta para historias 9:16** (dentro de la pantalla) con el vaso, el koi, el nombre ES/EN, "Rocky Point, MX" y @koitea.mx, con la indicación "Tómale captura y etiquétanos" (no hace falta descargar).
4. Menú en cuadrícula de 2 columnas, tarjetas limpias con el vaso, categorías como pestañas redondas; insignias tipo sticker solo para "De la casa", "Reseñas", "Agotado".
5. Ficha, carrito y cierre con el koi comentando (microcopy breve: "¡Buena elección!", "Agregué tu taro").
**Rasgo distintivo:** el koi como guía con comportamiento (estados reales, no adorno) y la tarjeta compartible para Instagram.
**Paleta:** crema cálido `#FFF6EC` (fondo), tinta `#2A2523` (texto y trazos 14.2:1), rojo koi `#C2361C` (botones con texto blanco 5.5:1), durazno `#F9C8B8` y taro claro `#D8C8EE` (burbujas y tarjetas; texto tinta ≥9.6:1), taro `#5B3E8F` (texto de acento 7.8:1).
**Tipografía:** *Baloo 2* (display) + *Nunito* (cuerpo) + *Klee One* (solo la voz del koi en las burbujas).
**Ilustración:** koi SVG propio + `KoiCup.svg` con contorno, **sin carita en los vasos** (el único personaje es el koi).
**Movimiento:** con personalidad pero breve; el koi nunca tapa el contenido ni bloquea botones.
**Evitar:** infantilizar, quiz obligatorio, emojis como íconos de interfaz, stickers como layout.

---

## v5 · Tablero — "El tablero en tu mano"

**Una línea:** el menú del teléfono y las 3 pantallas del local como un solo sistema, legible a la primera y bilingüe en paralelo.
**Faceta de marca:** las 3 pantallas verticales detrás de la barra (Milk Tea y Fruit Tea · el koi · Smoothies y Toppings), su color salvia, el ritmo vertical de la celosía; y el turista que necesita leer español e inglés a la vez.
**Investigación que la respalda:** contraste actual de las pantallas 1.75:1 (texto crema sobre salvia) vs. 7.96:1 con tinta; Cha.ology (señalética bilingüe en paralelo y retícula), CHAGEE (menú curado en series), estudio previo: "las 3 pantallas como una sola" y "cambiar precios sin diseñador" (un solo contenido alimenta teléfono y pantallas). Reemplaza a la hipótesis "Linterna" (modo oscuro), que la evidencia contradijo para un destino de playa (NN/g: el modo claro se lee mejor).
**Paradigma:** 3 tableros que se recorren deslizando en horizontal con scroll-snap nativo, como las 3 pantallas (Tablero 1 Milk Tea · Tablero 2 Fruit Tea con la Koi Tea de la casa destacada · Tablero 3 Smoothies y Toppings), con un indicador de 3 mini-pantallas arriba que muestra dónde estás y permite saltar. Cada tablero se desplaza en vertical. Filas de tablero: nombre en español grande + inglés debajo (bilingüe en paralelo; en EN se invierte la jerarquía), **puntos guía** hasta el precio, mini-vaso y botón "+" (`quick-add-<id>`). Tocar la fila abre la ficha.
**Pantallas:**
1. Encabezado: wordmark "KOI TEA · BOBA SHOP" redondeado, "Abierto 11:00–21:30", ES/EN y MXN/USD.
2. Tableros 1–3 (arriba). Pie de tablero: "*Todas las bebidas incluyen 1 topping" (como la pantalla real; por confirmar).
3. Ficha como hoja inferior con el mismo lenguaje de tablero (opciones con puntos guía: "Grande ······ +$15").
4. Carrito y ticket estilo comanda de barra (papel térmico, monoespaciado, bilingüe).
5. **"Ver en las pantallas del local"**: vista de las 3 pantallas verticales lado a lado (9:16 cada una, escaladas para caber en el teléfono, con desplazamiento horizontal si hace falta) mostrando el MISMO contenido en tamaño de lectura a 3–4 m, alto contraste (tinta sobre salvia), el koi al centro con "Síguenos @koitea.mx" y un QR de muestra marcado como "QR de ejemplo"; resalta en las pantallas la bebida que el cliente está viendo en el teléfono. Explica en una línea: "Cambias un precio una vez y cambia aquí y en tu celular".
**Rasgo distintivo:** un solo sistema para teléfono y pantallas, tipografía bilingüe en paralelo y puntos guía de tablero.
**Paleta:** salvia clara `#DCE5DF` (tablero; texto tinta 11.8:1), salvia `#AFC0B6` (bandas y encabezados; texto tinta 7.96:1), crema `#FEF4EB` (hojas y tickets), tinta `#2A2523` (texto), musgo `#3E4D45` (secundario sobre salvia 6.9:1), nogal `#483D42` (encabezado con texto crema 9.6:1), rojo koi `#A33119` (precios y acentos sobre salvia 5.4:1; sobre crema usa `#B83A22` 5.3:1).
**Tipografía:** *Jost* (títulos de tablero en mayúsculas espaciadas como las pantallas actuales, nombres y cuerpo) + *Red Hat Mono* (precios y puntos guía, tabulares) + *M PLUS Rounded 1c* 800 solo para el wordmark.
**Ilustración:** `KoiCup.svg` `mini` en filas; koi del logo en la pantalla central (imagen `img/logo.jpg` recortada en círculo sobre crema).
**Movimiento:** casi nulo en el teléfono (snap nativo, resaltes breves); en la vista de pantallas, un resalte suave de la bebida seleccionada.
**Evitar:** letras delgadas grises (el problema actual), ocultar precios, que el deslizar horizontal sea la única forma de cambiar de tablero (los mini-indicadores también navegan).
