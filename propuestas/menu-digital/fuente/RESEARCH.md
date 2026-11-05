# Investigación: lo que deben saber los constructores

Nota de método: la red de la sesión no permitió abrir la mayoría de los sitios (Instagram, Pinterest, Dribbble, Behance, sitios de cadenas, Uber Eats, NN/g…), así que la evidencia viene de los resúmenes del buscador. Las URL son reales; los datos se marcan como no verificados de primera mano.

## Lo que hacen las cadenas de boba (Gong cha, CHAGEE, HEYTEA, KOI Thé, Kung Fu Tea, CoCo, The Alley, Tiger Sugar, Xing Fu Tang, Mixue)

- Personalización con las mismas 4–5 variables en una sola ficha: **Tamaño → Topping incluido → Extras → Dulzor → Hielo**. Mismo orden y vocabulario en las 5 versiones.
- Dulzor en 5 niveles con palabra y % (escala de CoCo 100/70/50/30/0; Gong cha usa 5 palabras). Ya está en `KOI.sweetness`.
- Toppings en sección aparte con el costo extra visible: el primero dice **"Incluido"** y los demás **"+$15"** (`KOI.toppingPriceLabel`). Antes de cerrar, el desglose visible.
- En listas, precio base "desde"/"+"; en la ficha, precio vivo; en el botón, "Agregar · $120".
- Menú por series con una fila de destacados arriba: **Favoritos de la casa** = Koi Tea (insignia) + los combos de la reseña real de Google (Taro con tapioca; Durazno o Mango Green Tea con jelly de lichi). Nada de "lo más pedido" sin datos.
- La bebida insignia se presenta con componentes y una seña visual: la **Koi Tea** con su degradado rojo→naranja (como las rayas de Tiger Sugar).
- Nombres propios estables (no traducir "Maracuyá Green Tea" en ES; en EN usar `nameEn`); descripción, botones y ticket sí en el idioma activo.
- La queja más repetida de las apps de cadena es la fricción de entrada (login, elegir tienda, descargar). Aquí: **el menú abre directo**, sin registro.
- **Cierre con comprobante**: ticket con código grande, resumen, total y "Muéstralo en caja"; el mismo código va en el mensaje de WhatsApp (pantalla de retiro de Xing Fu Tang; reseñas que le reclaman a CHAGEE la falta de recibo).
- "Repetir pedido" con historial local (Kung Fu Tea, CHAGEE) — opcional, con localStorage en try/catch.
- Mascota como sistema (Snow King de Mixue): estados vacíos, confirmaciones, sin resultados. Con la contención estética de The Alley (venado de línea, refinado), **sin volverla chibi**.
- Diferenciarse de **KOI Thé** (cadena global de nombre casi idéntico, perlas "golden"): reforzar "Koi Tea · Rocky Point" y la mascota kohaku.
- Merch (playeras, gorras, tote "Rocky Point, MX") como tarjeta informativa al final del menú.

## Lo que muestran Behance, Dribbble, Pinterest, Awwwards y la prensa de diseño (2025–2026)

- **El vaso es la firma y la interfaz** (Shenzhen Bubble Milktea, NINELIVES, CHAGEE): un vaso de línea con estados (sabor, topping, dulzor, hielo) sirve en lista, armador, carrito y ticket. Es `KoiCup.svg`.
- **Hecho a mano gana a 3D pulido** (Creative Bloq 2026 "Anti-AI crafting"): trazo de tinta como el logo y las tapas; un grano de papel sutil está bien. Nada de 3D.
- **Toppings "gummy"** (Pinterest Predicts 2026: jelly candy aesthetic): perlas y jellys como gotas translúcidas con brillo (radial-gradient), tapioca mate y oscura.
- **Color por sabor sobre neutros estables** (Boba Ice Cream, Site of the Day): el color de la bebida tiñe halo/chip/transición, **no pinta toda la pantalla** (eso fue B·Pop).
- **El patrimonio como sistema propio** (Cha.ology, CHAGEE): usa lo que Koi ya tiene — ritmo vertical de la **celosía**, el **arco** de la galería como máscara de imagen, escamas kohaku, tinta de las tapas, y los **cubos de luz** (torii, vaso, koi, hoja) como íconos. **Nada de kanji decorativo.**
- **Bilingüe como sistema tipográfico** (Cha.ology): español grande + inglés como subtítulo en la misma pieza funciona mejor que solo un botón; probar la cadena más larga a 360 px ("Passion Fruit Green Tea").
- **Mascota con comportamiento** (Creative Bloq, Mixue, BLOOP): 5–6 estados del koi ligados a eventos reales (saluda, piensa, celebra, triste por agotado, duerme fuera de horario).
- **Tarjeta para compartir 9:16** con el koi, la bebida, "Rocky Point, MX" y @koitea.mx (momento foto de Mixue).
- **Bento** solo anclado a una retícula con sentido (celosía/tatami) y máx. 4–6 tiles.
- Envejecen mal: glass/Liquid Glass con texto encima (solo en barras con fondo opaco ≥0.85 y respaldo), 3D, pixel/ácidos, kawaii copiado (cara chibi), stickers como layout (solo como insignias), tipografía gigante sin control (clamp y máx. 2 líneas).
- **Modo oscuro**: NN/g — el modo claro se lee mejor con visión normal; de noche el texto chico cuesta más en oscuro. En un destino de playa, oscuro solo como tema, no como versión única.

## Contraste y color (calculado)

- Rojo koi `#F94E2B` sobre crema: 3.15:1 → solo ilustración, mancha del koi, bloques grandes. Para **texto** rojo usa `#C63F26` (4.67:1) o `#B83A22` (5.28:1); botones con texto blanco: `#C2361C` (5.47:1).
- Milk tea `#D0A585` (2.06:1) y taro `#AA81B3` (2.98:1) sobre crema son **decorativos** (ni bordes de control).
- Sobre nogal `#483D42`: crema 9.57:1; ámbar `#C39056` 3.68:1 (solo íconos/texto grande); ámbar para texto `#E0B07A` (5.27:1).
- Las pantallas actuales: texto crema sobre salvia `#AFC0B6` = 1.75:1 (por eso no se leen); tinta `#2A2523` sobre salvia = 7.96:1.

## Precios de referencia

Gong cha México: MX$78 por milk tea (Uber Eats AICM) y MX$86–150 (Rappi). EE. UU.: $6–9 USD por bebida, toppings +$0.75–1.50. Los precios ilustrativos de Koi Tea (MX$85–95, extras MX$15) están en rango.

## Patrones de pedido (McDonald's, Starbucks, Chipotle, Sweetgreen, Domino's, Baymard, WhatsApp)

- Valores de la casa ya marcados: "Agregar" funciona desde el primer toque; personalizar es la norma (81% del último pedido por app fue personalizado, MFour) pero no debe ser obligatorio.
- Todo lo que depende de la elección (precio MXN/USD, resumen, vaso) se recalcula **en el mismo instante** (Starbucks falló en esto, Prototypr).
- Dulzor e hielo con controles segmentados **visibles** de ≥44 px con palabra y %; nada de gestos ocultos ni desplegables.
- Carrito editable: cada línea con sus modificadores en texto corto; idealmente "Editar" reabre la ficha prellenada; "Quitar" con opción de deshacer dentro de la página (nunca `confirm()`).
- "Pedir de nuevo" / favoritos guardados arriba del menú cuando existan (Baymard: el inicio es donde se busca repetir; Domino's guardaba pizzas con nombre). localStorage en try/catch.
- Cierre "Mostrar en caja": código corto sin caracteres confusos, fecha y hora, **"Paga en caja"** y, si cabe, modo de entrega (Para llevar / Para tomar aquí). Alto contraste, legible a un brazo de distancia.
- WhatsApp: `https://wa.me/52XXXXXXXXXX?text=` armado a mano (los enlaces cortos de Meta limitan a 140 caracteres). `KOI.waMessage` ya pone el código primero, el total con su equivalente en la otra moneda y "Pago en caja al recoger".
- Venta adicional: si se usa, una sola sugerencia relevante y descartable dentro del carrito ("Hazla grande +$15", "Agrega perlas explosivas +$15"), nunca un modal que bloquee.
- Fuera de horario (11:00–21:30) el pedido por WhatsApp debería avisar que está cerrado (opcional en el prototipo).

## Reglas de UX con evidencia (NN/g, Baymard 2026, Toast, Cornell, NYU Stern, WCAG 2.2, web.dev)

1. **El menú se ve en la primera pantalla.** El QR vale por el flujo que abre (NN/g): sin splash, sin "instala la app", sin elegir idioma antes de ver. Si una dirección abre con una entrada (Galería, Koi guía), que sea breve, con salida inmediata al menú (un toque) y que las primeras bebidas se asomen o estén a un toque; nada de pantallas de bienvenida a pantalla completa que haya que esperar.
2. **Lo digital debe dar algo que la pantalla de la barra no da** (Toast: 81% prefiere menú físico; 90% de mayores de 55): entender la bebida (imagen + qué es), ES/EN y MXN/USD, y armar el pedido para mostrarlo en caja sin dictarlo.
3. **Precio:** en listas, número limpio con la moneda clara en el conmutador o encabezado; donde se decide y se paga (ficha, carrito, ticket), moneda explícita y el equivalente: "85 MXN · ≈ US$4.75" (los turistas se anclan al valor nominal: "ilusión monetaria", NYU Stern 2012). Un "$85" suelto puede leerse como dólares.
4. **La barra lee en español:** si la interfaz está en inglés, el ticket de "Mostrar en caja" muestra también la receta en español para el personal (`KOI.describe(d, cfg, 'es')`). `KOI.waMessage` ya agrega la línea "(ES)".
5. **Tamaños mínimos de texto:** cuerpo ≥16 px, nombre de bebida ≥18 px, precio ≥16 px con cifras tabulares; nunca bloquear el zoom.
6. **Valores por defecto = recomendación** (meta-análisis, d = 0.68): la ficha abre "como la prepara la casa" con "Agregar · precio" activo.
7. **Peso:** el turista con roaming agotado navega a 128–256 kbps (T-Mobile); la primera vista útil debe pesar poco (HTML + CSS + datos + SVG), fotos diferidas.
8. **Popularidad honesta:** "Lo más pedido" solo con datos reales (Cai et al. 2009: +13–20% en los platillos listados); hoy, "Favoritos de la casa" y "Recomendado en reseñas".

## Moneda (línea de mercado)

- Se cobra en MXN y el MXN se ve siempre donde se paga; el USD es referencia con "≈" y un tipo de cambio de la casa editable y con fecha (en el prototipo: 18, ilustrativo).
- El total en USD se calcula desde el total en MXN (`KOI.cartTotal` ya lo hace); no sumes líneas redondeadas.
- Rango de precios: Gong cha México MX$78–150 en apps; EE. UU. US$6–11 con topping aparte (+US$0.75–1.50). Con 1 topping incluido, Koi Tea (≈US$4.75–5.25) es un argumento de venta para el turista: dilo en inglés ("1 topping included").
- Sonora no cambia de horario (UTC−7, igual que Arizona): "Abierto ahora" se calcula con America/Hermosillo.

## Dirección de arte con datos medidos (Google Fonts, W3C, APCA)

- **Rojo:** `#F94E2B` solo ilustración, bloques, sello, íconos sobre crema/blanco/muro y titulares ≥24 px bold. Texto rojo `#C2361C` solo sobre crema, blanco o muro (≥5:1). **Sobre superficies tintadas** (miel, durazno, taro claro, salvia) el rojo no llega a AA: ahí el texto va en tinta `#2A2523` o en `#A33119`/`#8E2A15`.
- **Anillo de foco:** el rojo vivo solo cumple 3:1 sobre crema, blanco o muro. Sobre salvia, miel, durazno, taro claro o el haz de luz, usa foco en tinta o doble anillo (tinta + blanco).
- **No escribas íconos como texto** (→, ✓, ★, ✕): no están en el subset latino de Google Fonts y cambian de fuente o descargan otro archivo. Dibuja íconos en SVG.
- **Altura de línea mínima** para no recortar acentos/descendentes con overflow o line-clamp: Instrument Serif 1.22, Jost 1.27, Figtree 1.13, Rubik 1.13, Schibsted 1.18, Baloo 2 1.09, Nunito 1.22, M PLUS Rounded 1c 1.21. Las fuentes japonesas, solo en textos cortos.
- **Precios** siempre en la sans o mono con `font-variant-numeric: tabular-nums`, nunca en la serif de display. Sin `font-variant: small-caps` falsas: mayúsculas reales a ~0.8 em con tracking.
- `font-synthesis: none` para que ningún `<em>` incline de mentira una fuente sin itálica.
- **Sello** como gesto de cierre: la barra tiene una selladora de vasos; "sellar" el pedido es un ritual real del local.
- **No publiques datos culturales no verificados** (significados del koi, fechas de Chun Shui Tang/Hanlin, Alishan): la red no permitió verificarlos. "Ingredientes importados de Taiwán" sí es del local.
- Peso de fuentes medido: v1 ≈86 KB, v2 ≈35 KB, v3 ≈31 KB, v4 ≈105 KB (la más pesada: considera prescindir de una familia), v5 ≈70 KB.
