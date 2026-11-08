# Contexto del proyecto · Pantallas de la barra de Koi Tea

Documento para continuar este trabajo en un proyecto nuevo, separado del repositorio `vibeKOITEA`.

## Referencias

| Qué | Dónde |
|---|---|
| Artifact publicado (página con vista previa en vivo de las 6 versiones, comparativa, investigación y producción) | https://claude.ai/artifact/VJm4Rp45jrJ12KZcyPohs2 |
| Repositorio | https://github.com/LuisMario698/vibeKOITEA, carpeta `pantallas/` |
| Rama de trabajo | `claude/loving-euler-oztqhz` (sin PR) |
| Archivo que se publica como artifact | `pantallas/dist/index.html` (se genera con `node tools/build.cjs`; todo en línea salvo Google Fonts) |
| Sesión relacionada en Claude Code | «Diseño menú digital Koitea» (propuesta de menú digital; de ahí salen los precios ilustrativos) |

Historial de commits en la rama:

1. `3b6c90b` cinco animaciones para las pantallas de la barra
2. `7d12f8b` revisión de dirección de arte en las cinco versiones
3. `9ea85e0` transiciones propias por versión y ajustes de lectura
4. `89a1351` bebida en 3D para Koi vivo y Estanque
5. `11c6bb6` versión 6 «Letrero»

Para separarlo: copiar la carpeta `pantallas/` completa a un repositorio nuevo. Es autocontenida (no depende del resto de `vibeKOITEA`). Los videos de `export/` no están en git (pesan ~50 MB cada uno); se regeneran con `tools/export.cjs`. `dev/logo.jpg` y `dev/screens.jpg` (fotos del cliente para calcar) tampoco se suben.

## El encargo

Animaciones para las **tres TV verticales detrás de la barra** de Koi Tea Boba Shop (Puerto Peñasco / Rocky Point, Sonora). Hoy las laterales muestran el menú (texto gris delgado sobre salvia) y la central solo el logo. Se pidieron 5 versiones (de pantalla central y de tres pantallas), profesionales y acordes al local, la marca y la empresa. Después el cliente:

- eligió **Koi vivo** (central) y **Estanque** (tres pantallas) para desarrollar;
- pidió la bebida del momento «más realista, con efectos 3D»;
- pidió una **versión nueva (6 · Letrero)** con la fuente del letrero de la fachada y 4 secciones: logo y nombre → bebida del momento → sabor y arte → QR e información.

## La marca y el local

- **Mascota**: koi kohaku (blanco con manchas rojas) sobre un vaso de boba, en línea negra. Está calcada en vector en `src/mascot.js`.
- **Letrero de la fachada**: letras de canal rojas «KOI TEA» (gruesas, redondeadas, inclinadas, con remates más anchos y la A sin barra, «Λ»), cara roja `#E8452B`, costados blancos; abajo una caja de luz blanca con filete rojo y «BOBA SHOP» en gris pizarra `#3E4652` muy espaciado. No es una fuente comercial identificada: se **redibujó a partir de la foto** (`src/sign3d.js`). Si la marca tiene el vector original, puede sustituirse.
- **Frase**: «El sabor y el arte se unen en un mismo espacio» / «Where flavor meets art».
- **Instagram**: @koitea.mx (el QR real está embebido en `kit.js`, generado con segno).
- **Interior**: japandi cálido (muros crema, nogal), plafón curvo con tira LED cálida, columna con 4 cubos iluminados (torii, vaso, koi, hoja), galería al fondo.
- **Datos por confirmar con el negocio**: horario `11:00 – 21:30`, dirección `C. Benito Juárez 276`; precios en `src/data.js`, **ilustrativos** (85–95 MXN, tipo de cambio de ejemplo 18).

## Las seis versiones

| # | Nombre | Pantallas | Loop | Idea |
|---|---|---|---|---|
| 1 | Koi vivo · **elegida** | Central | 36 s × 3 bebidas | La mascota se dibuja, sorbe su boba y presenta la bebida del momento **en 3D**; cierra con QR. |
| 2 | Tinta | Central | 40 s × 3 obras | Sumi-e: ensō, 鯉 escrito en orden de trazos (KanjiVG), la bebida pintada con ficha de museo, frase y QR en un ensō. |
| 3 | Estanque · **elegida** | Las tres | 60 s × 3 vueltas | Estanque color té; el menú flota en placas fijas; 2 koi nadan por las orillas y cruzan bajo el muro; bebida recomendada en 3D; al final los koi giran cabeza con cola alrededor de 鯉; en la 3.ª vuelta las placas se apartan 7 s. |
| 4 | Luz | Las tres | 60 s × 3 vueltas | La línea de luz del plafón cruza las pantallas; cubos del local como capítulos; pulsos que iluminan el menú; «acorde de té» (vertidos que drenan a un vaso). |
| 5 | Atardecer | Las tres | 60 s × 3 luces | Friso del Mar de Cortés en línea (olas, gaviotas, Cerro de la Ballena, mascota); 3 luces de tarde; el sol entra en un vaso de Koi Tea. |
| 6 | Letrero · **nueva** | Central | 44 s × 3 bebidas | Ver abajo. |

### Versión 6 · Letrero (la más reciente)

`src/versions/v6.js`. Secciones por vuelta (bebidas: Koi Tea, Taro Milk Tea, Brown Sugar Milk Tea):

1. **Marca (0–10 s)**: la mascota se dibuja; las letras 3D se levantan una por una con su sombra; un brillo las cruza; se enciende la caja de luz «BOBA SHOP».
2. **Bebida del momento (10–24 s)**: vaso 3D que entra girando, perlas con rebote, servido en capas, hielo, tapa sellada impresa, popote y condensación; precio en MXN.
3. **Sabor y arte (24–33 s)**: «sabor» se llena con la bebida de la vuelta (capas, perlas, burbujas); «arte» se pinta a pincel; sello 鯉; frase y versión en inglés.
4. **Síguenos (33–44 s)**: el letrero otra vez, QR, @koitea.mx, horario y dirección.

Entre secciones pasa una cinta roja inclinada como las letras (−0.2 de inclinación, igual que el letrero). Laterales por defecto: menú recoloreado en crema.

## Decisiones de diseño (válidas para todo)

- **Legibilidad a 3–4 m en TV de 55"**: nombres y precios ≥ 62 px, secundario ≥ 46 px, titulares ≥ 100 px. Contraste: tinta sobre crema; inglés en nogal; rojo de texto `#B83219` (el rojo koi `#F94E2B` solo para decoración).
- **Precios** sin «$», con la etiqueta MXN; equivalente en USD solo como referencia en escenas de bebida; nota «Precios en pesos mexicanos (MXN)» en el menú.
- **Menú quieto**: nombres y precios nunca se mueven; en las versiones de tres pantallas el menú está visible ~96 % del tiempo (toma completa de 7 s cada 3 min).
- **Sin destellos** (WCAG 2.3.1): cambios de luz ≥ 0.5 s, nada rojo/crema alternando.
- **Movimiento**: una cosa entra a la vez; koi ≤ 150 px/s; los koi nunca pasan bajo un texto (rutas por carriles verificadas).
- **Tipografía**: Jost (texto y logotipo tipográfico), DM Serif Display (titulares en cursiva; solo tiene peso 400), Yuji Syuku / Shippori Mincho para acentos japoneses; en v6 el nombre usa las letras 3D del letrero y los titulares van inclinados igual que él.
- **Reflejo de las lámparas**: en la central, franja izquierda a ~38 % de alto; ningún precio ahí. La página tiene el botón «Lámparas» para simularlo.
- **Huecos entre TV**: las versiones de tres pantallas dibujan un mundo de 3720 × 1920 que incluye dos huecos de 240 px; lo que cruza pasa «detrás del muro» (efecto túnel).

## Arquitectura técnica

- Todo es **Canvas 2D + Three.js (r149, MIT, `vendor/three.min.js`)** y **función pura del tiempo**: el mismo código sirve para la página, el modo kiosco sincronizado por reloj y la exportación a MP4 cuadro por cuadro. Probado: el loop empata sin saltos entre vueltas y los cuadros son idénticos entre cargas.
- Lienzo por pantalla 1080 × 1920.
- Archivos clave en `pantallas/src/`:
  - `kit.js`: primitivas: tiempo y easing, color (incluye mezcla OKLCH), texto con entradas, papel, pincel/ensō/tinta, caligrafía por trazos (`KT.calli`), sellos, `KT.card`, `KT.priceBlock`, QR.
  - `kanji.js`: trazos de 鯉 y 茶 de KanjiVG (CC BY-SA 3.0).
  - `mascot.js`: la mascota.
  - `koi.js`: koi visto desde arriba y rutas Hermite en el tiempo.
  - `cup.js`: vaso plano (respaldo sin WebGL).
  - `drink3d.js`: **bebida 3D**: `KT.drink3d.draw(ctx, cx, by, H, drink, {fill, pearls, ice, seal, straw, cond, spin, t, alpha, fadeTop, strawColor})`.
  - `sign3d.js`: **letrero 3D**: `KT.sign3d.draw(ctx, cx, cy, W, {intro, sweep, yaw, alpha})`. El contorno de cada letra se traza con marching squares y se extruye.
  - `data.js`: menú y precios.
  - `boards.js`: menús laterales (hoy, rediseñado, en crema).
  - `engine.js`: página, pared, línea de tiempo, modo kiosco.
  - `versions/v1–v6.js`.
  - `page.html`, `content/*.html`: textos de la página.
- **Modo kiosco**: `index.html?screen=L|C|R&v=v6&gap=240&dy=0&lat=0&sides=crema`. Las pantallas se sincronizan con la hora del sistema y un ancla común (1 nov 2026, 17:30 Sonora); con varias Raspberry Pi, una sirve la hora con chrony.
- **Producción recomendada**: una Raspberry Pi 5 por pantalla con Chromium en kiosco (necesita WebGL para el 3D), o MP4 en USB para las versiones de pantalla central.

## Comandos (desde `pantallas/`, Node + Playwright)

```bash
node tools/build.cjs                                  # genera dist/index.html y dev/index.html
node tools/shoot.cjs --v v6 --t 5,20 --cycle 1 --scale 0.5 --slots --out shots
node tools/seams.cjs                                  # costuras del loop y determinismo
node tools/fps.cjs                                    # cuadros por segundo
node tools/pageshot.cjs out.png 1440 1000 light full v6 dist
node tools/export.cjs --v v6                          # MP4 1080×1920 30p (+ versión girada para USB)
```

En un navegador sin GPU (como el de pruebas) cada cuadro con 3D tarda ~100–600 ms; con GPU es fluido. Exportar v6 toma ~25–30 min.

## Estado y pendientes

- Hecho y publicado: las 6 versiones, revisión de arte aplicada, revisión de señalización aplicada a v1 y v3, bebida 3D en v1/v3/v6, letrero 3D en v6.
- Videos exportados en esta sesión: `v1_koi-vivo_C_1080x1920_30p.mp4`, `v1_koi-vivo_USB_1920x1080_30p.mp4` (ya enviados); `v6_letrero` se estaba exportando al cerrar.
- Pendiente:
  - Confirmar con el negocio: precios, horario, dirección; archivo vectorial del letrero si existe.
  - Probar rendimiento en la Raspberry Pi 5 real (WebGL); si no llega a 30 cps, usar MP4.
  - Las revisiones independientes de errores, mirada del dueño y arte (segunda ronda) no terminaron por límite de uso.
  - Medir en el local: modelo y tamaño de las TV, hueco real entre imágenes, toma de red, reflejos desde la fila.
  - Para la versión final: un sello 鯉 dibujado por un calígrafo en lugar del generado con KanjiVG.
