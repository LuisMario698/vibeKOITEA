# Pantallas Koi Tea

Seis animaciones para las tres pantallas verticales de la barra de Koi Tea Boba Shop (Puerto Peñasco). Todo se dibuja en Canvas 2D y depende solo del tiempo, así que el mismo código sirve para:

- la página de presentación (`dist/index.html`, publicada como artifact),
- el modo kiosco sincronizado por reloj (una URL por pantalla),
- la exportación a MP4 cuadro por cuadro.

| Versión | Pantallas | Loop |
|---|---|---|
| 1 · Koi vivo | Central | 36 s × 3 bebidas |
| 2 · Tinta | Central | 40 s × 3 obras |
| 3 · Estanque | Las tres | 60 s × 3 vueltas (toma de 7 s en la tercera) |
| 4 · Luz | Las tres | 60 s × 3 vueltas (acorde de té en la tercera) |
| 5 · Atardecer | Las tres | 60 s × 3 luces (puesta de sol en la tercera) |
| 6 · Letrero | Central | 44 s × 3 bebidas (marca, bebida en 3D, sabor y arte, QR e información) |

Los precios son ilustrativos y están en `src/data.js`.

## Estructura

```
src/
  kit.js        primitivas: tiempo, easing, color (OKLCH), texto, papel, tinta, caligrafía por trazos, sello, QR real a instagram.com/koitea.mx
  kanji.js      trazos de 鯉 y 茶 de KanjiVG (Ulrich Apel, CC BY-SA 3.0) para la caligrafía y los sellos
  mascot.js     la mascota calcada del logo, con estados (parpadeo, aletas, sorbo, dibujo de línea)
  koi.js        koi visto desde arriba (línea, tinta y sombra) y rutas periódicas (Hermite en el tiempo)
  cup.js        vaso plano con tapa sellada, capas, toppings, hielo (respaldo sin WebGL)
  sign3d.js     el letrero «KOI TEA» en 3D: letras redibujadas de la foto de la fachada, contorno trazado y extruido
  drink3d.js    la bebida en 3D con Three.js (vendor/three.min.js, MIT): vaso, capas, perlas, hielo, tapa, popote, condensación
  data.js       menú y precios (ilustrativos)
  boards.js     menús laterales: los actuales, los rediseñados y los actuales recoloreados en crema (texto en caché, nunca se mueven)
  versions/     v1.js … v5.js
  engine.js     página: selector, pared con las 3 pantallas y su hueco, reloj, línea de tiempo, modo kiosco
  page.html     plantilla de la página
  content/      textos de la página (comparativa, investigación, producción)
tools/          build, capturas, pruebas y exportación (Node + Playwright)
```

Lienzo: 1080 × 1920 por pantalla. Las versiones de tres pantallas dibujan un mundo de 3720 × 1920 que incluye los dos huecos de pared (240 px cada uno); cada pantalla recorta su tramo.

## Comandos

```bash
node tools/build.cjs                      # genera dist/index.html (todo en línea) y dev/index.html
node tools/shoot.cjs --v v3 --t 5,20 --cycle 2 --scale 0.5 --slots --out shots
node tools/sheets.cjs qa 0.22             # hojas de contacto de todas las versiones y vueltas
node tools/seams.cjs                      # costuras del loop y determinismo
node tools/fps.cjs                        # cuadros por segundo en la página
node tools/export.cjs --v v1 --preview    # MP4 maestro 1080×1920 30p (+ versión girada para USB)
```

## Modo kiosco

Abrir `dist/index.html` con parámetros (fuera del artifact, por ejemplo en una Raspberry Pi 5 con Chromium en modo kiosco):

```
index.html?screen=C&v=v1
index.html?screen=L&v=v3&gap=240&dy=0&lat=0
```

- `screen`: L, C o R.
- `v`: versión (v1 … v5).
- `gap`: hueco real entre imágenes encendidas, en px de contenido (1080 × distancia ÷ ancho de la imagen).
- `dy`: diferencia de altura entre soportes, en px.
- `lat`: retraso de esa TV, en ms.
- `sides`: solo para las versiones de pantalla central; `crema` muestra en las laterales el menú recoloreado (crema y tinta, sin animación). Sin el parámetro, las laterales quedan como hoy.

Todas las pantallas calculan el mismo instante a partir de la hora del sistema y de un ancla común (la apertura, 1 nov 2026 17:30), así que no necesitan hablar entre sí. Con varias Raspberry Pi, la del centro sirve la hora a las demás con chrony.
