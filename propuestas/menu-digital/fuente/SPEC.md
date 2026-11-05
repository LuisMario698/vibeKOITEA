# Especificación común de los 5 prototipos

Lee también: `KOI5/BRIEF.md` (cliente y marca), `KOI5/shared/README.md` (API de datos y vasos), `KOI5/DIRECTIONS.md` (tu dirección de diseño).

## Entregable

- Un solo archivo `KOI5/vN.html`: documento completo (`<!doctype html>`, `<html lang="es">`, `<head>` con `<meta charset="utf-8">` y `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<title>`).
- CSS y JS propios en línea. Vanilla JS (sin frameworks, sin Three.js). Solo se permiten recursos externos de Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`), siempre con pila de respaldo.
- Módulos compartidos con estas etiquetas literales: `<script src="shared/koi-data.js"></script>` y `<script src="shared/koi-cup.js"></script>`, antes de tu script.
- Imágenes solo de `img/` (logo.jpg, bar.jpg, cubes.jpg, gallery.jpg, merch.jpg, fruit-teas.jpg). El logo es JPG cuadrado con fondo crema `#FEF4EB`: recórtalo en círculo o ponlo sobre crema; nunca lo estires.
- Se mostrará dentro de un `<iframe>` de ~390×844 (marco de teléfono) y también a pantalla completa en cualquier tamaño. Diseña para móvil; **en pantallas anchas (>600px) la app se centra en una columna de máximo ~480px** con un fondo que acompañe (nada estirado a 1400px).
- `position: fixed` está bien (es relativo al iframe). Usa `height: 100%`/`100dvh` con cuidado: el iframe mide lo que mide el teléfono; no dependas de la barra del navegador.

## Funciones obligatorias

1. **Bienvenida/inicio** con el logo, nombre y el dato de Taiwán o la frase de la marca; horario y ubicación accesibles en algún lugar (pantalla de info o pie).
2. **Navegar el menú completo**: 3 categorías, 15 bebidas, toppings (13, en 3 grupos). Cada bebida muestra nombre, precio y descripción (en la ficha si no cabe en la lista).
3. **Ficha / personalización** según `KOI.optionsFor(d)`: tamaño (Mediano / Grande +$15), toppings (1 incluido, extras +$15, máximo 3; el primero elegido se marca "Incluido" y los demás "+$15" con `KOI.toppingPriceLabel`; el topping agotado se ve deshabilitado), dulzor (5 niveles: Normal 100 · Menos 70 · Mitad 50 · Poco 30 · Sin azúcar 0, con palabra y %) e hielo (sin, poco, normal) **solo si aplican** (smoothies sin dulzor ni hielo). Precio en vivo con `KOI.unitPrice`. Cantidad. Botón agregar.
4. **Carrito**: ver líneas con `KOI.describe`, cambiar cantidad, eliminar, total con `KOI.cartTotal`. Estado vacío diseñado.
5. **Cerrar pedido** con dos salidas:
   - **Mostrar en caja**: pantalla de ticket con código grande (`KOI.orderCode()`, generado una vez al cerrar), líneas y total, legible para el cajero. Mostrar el ticket NO vacía el carrito; ofrece "Nuevo pedido" (vacía) y "Volver" (conserva).
   - **Pedir por WhatsApp (para llevar)**: campos opcionales nombre y hora; vista previa del texto de `KOI.waMessage`; botón Copiar (clipboard dentro del click, con respaldo de seleccionar texto); nota "En producción este botón abre WhatsApp con el mensaje listo". No navegues a wa.me.
6. **ES/EN y MXN/USD** siempre a mano (toggles visibles desde la pantalla principal). Cambiar idioma o moneda no debe perder el carrito ni cerrar lo que el usuario tiene abierto de forma rota; todo el texto visible cambia (incluidos aria-label y mensajes).
7. **Agotado**: `smooth-maracuya` se ve agotada y no se puede agregar; `pop-cereza` deshabilitado en toppings.
8. **Avisos honestos** visibles pero discretos: `KOI.meta.pricesNote` y `KOI.meta.protoNote` (en el idioma activo).
9. Lo que hace única a tu dirección (ver DIRECTIONS.md): impleméntalo completo y pulido; es lo que el cliente va a recordar.

## Ganchos de prueba (obligatorios, se usan en una batería común para las 5 versiones)

Pon estos atributos `data-testid` exactos en elementos clicables reales (`<button>`, o el elemento que recibe el clic):
- Inicio: `lang-es`, `lang-en`, `cur-mxn`, `cur-usd` (los toggles; deben estar en el DOM y clicables desde la pantalla principal del menú). Si tu dirección empieza con una pantalla previa (bienvenida, quiz, armador), agrega `go-menu`: el botón que lleva al menú completo.
- Menú: `drink-<id>` en el elemento que abre la ficha de cada una de las 15 bebidas (p. ej. `drink-taro`, `drink-smooth-maracuya`). Debe existir en el DOM una vez que se está en el menú (aunque haya que desplazarse para verlo; Playwright desplaza solo).
- Ficha: `size-regular`, `size-grande`, `topping-<id>` (13), `sweet-<v>` (0, 30, 50, 70, 100), `ice-<id>` (none, less, normal), `qty-inc`, `qty-dec`, `unit-price` (el texto del precio en vivo) y `add-to-cart`. El estado elegido debe reflejarse con `aria-pressed="true"` o `aria-checked="true"` (o `checked` en inputs).
- Carrito: `open-cart` (abre el carrito desde el menú), `cart-line` en cada línea, y dentro de cada línea `line-inc`, `line-dec`, `line-remove`, `line-total`; `cart-total` (texto del total) y `cart-empty` (estado vacío).
- Cierre: `checkout-counter` (Mostrar en caja), `order-code` (el código), `checkout-whatsapp`, `wa-name`, `wa-time`, `wa-message` (el texto del mensaje), `wa-copy`.
- Cierra diálogos con Escape y con un botón `close` visible.
- Opcional: si tu menú permite agregar una bebida con su configuración por defecto sin abrir la ficha, pon `quick-add-<id>` en ese botón.
- Antes de entregar, corre la batería común: `node KOI5/tools/suite.js KOI5/vN.html` (ruta absoluta) y deja todo en `ok`.

## Calidad (se va a revisar con lupa)

- Sin errores en consola. Sin `alert/confirm/prompt`. Sin enlaces `tel:`/`mailto:`/`wa.me` que naveguen.
- Sin scroll horizontal ni texto cortado/encimado a 320, 360, 375, 390, 414 y 430 px de ancho, ni a 1280 px.
- Diálogos/hojas: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, foco al abrir, foco de regreso al cerrar, Escape cierra, el fondo no se desplaza detrás (scroll lock) y se restaura al cerrar.
- Objetivos táctiles ≥ 44×44 px. Contraste de texto AA (4.5:1; 3:1 en texto ≥ 24px o negrita ≥ 18.7px). Foco visible con `:focus-visible`.
- `prefers-reduced-motion: reduce` → sin animaciones grandes (solo fundidos cortos).
- Botones reales (`<button>`) para acciones; nada de `div` clicables sin rol/teclado.
- `localStorage` solo envuelto en try/catch y opcional (favoritos, último pedido); la app funciona sin él.
- Números con `font-variant-numeric: tabular-nums` donde se alinean.
- Textos en español de México correcto (tildes, ¿¡, ñ) y en inglés natural. Nada de lorem ipsum.
- Nada de "más vendido" ni cifras inventadas; "Recomendado en reseñas" solo para las bebidas con tag `resena`; "De la casa" para `koi`.
- Rendimiento: el HTML propio idealmente < 120 KB; animaciones con transform/opacity; nada de bucles `requestAnimationFrame` corriendo sin necesidad (páusalos cuando no se ven).

## Protocolo de pruebas (obligatorio antes de entregar)

Usa el helper `KOI5/tools/pw.js` (Playwright con proxy para Google Fonts):

```js
const { open, overflow, fonts } = require('KOI5/tools/pw.js'); // ruta absoluta
const { browser, page, errors } = await open('KOI5/vN.html', { width: 390, height: 844 });
// ... clics, page.screenshot({ path: 'KOI5/shots/vN-*.png' }) ...
console.log(errors, await overflow(page), await fonts(page));
await browser.close();
```

1. Carga a 390×844: 0 errores, fuentes cargadas, captura de la pantalla inicial.
2. Flujo completo con clics reales: abrir una milk tea, cambiar tamaño, agregar 2 toppings (verifica +$15), dulzor y hielo, agregar ×2; abrir un smoothie (sin dulzor/hielo) y agregarlo; intentar la agotada; abrir carrito, cambiar cantidades, eliminar una línea; comprobar que el total mostrado = `KOI.cartTotal`; cerrar pedido en ambas salidas; copiar mensaje.
3. Cambiar a EN y USD en medio del flujo (con el carrito lleno y con una ficha abierta) y verificar que todo cambia sin romperse.
4. Teclado: Tab llega a todo, Escape cierra diálogos, el foco regresa.
5. `overflow()` vacío a 320, 360, 390, 430 y 1280 de ancho.
6. Modo `reducedMotion: true` sin errores.
7. Accesibilidad automática: `const { axe, smallTargets } = require('KOI5/tools/pw.js')`; `await axe(page)` debe quedar sin violaciones `critical`/`serious` en la pantalla inicial, con la ficha abierta, con el carrito abierto y en el cierre de pedido; `await smallTargets(page)` vacío (si algo menor a 44px es inevitable, justifícalo en tu reporte).
8. Mira tus capturas con Read y corrige lo que se vea mal (alineaciones, recortes, contraste, jerarquía). Repite hasta que se vea profesional.
Guarda capturas finales en `KOI5/shots/vN-*.png` (deviceScaleFactor 1 para tus revisiones).
