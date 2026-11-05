# Menú digital de Koi Tea · iteración 2 (propuestas)

Cinco propuestas de menú digital para **Koi Tea Boba Shop** (Puerto Peñasco, Sonora), construidas como prototipos funcionales sobre el menú real del local. Es material de propuesta, no el sitio de producción.

| Versión | Idea | Archivo fuente |
| --- | --- | --- |
| V1 · Galería | El menú como catálogo de exposición, con cédulas de museo | `fuente/v1.html` |
| V2 · Armador | El vaso es la interfaz: se llena en vivo mientras eliges | `fuente/v2.html` |
| V3 · Express | Pedir en tres toques, en tu idioma y tu moneda | `fuente/v3.html` |
| V4 · Koi guía | La mascota pregunta y recomienda; tarjeta para historias | `fuente/v4.html` |
| V5 · Tablero | Celular y las 3 pantallas del local como un solo sistema | `fuente/v5.html` |

## Cómo verlas

Las fuentes cargan `shared/koi-data.js` y `shared/koi-cup.js` con rutas relativas: sirve la carpeta `fuente/` (por ejemplo `python3 -m http.server` dentro de ella) y abre `v1.html` … `v5.html` en el navegador, idealmente con la vista de celular de las herramientas de desarrollo.

## Qué hay aquí

- `fuente/shared/`: datos del menú (15 bebidas, 13 toppings, tamaños, dulzor, hielo), lógica de precios MXN/USD, carrito y mensaje de WhatsApp, y el generador de vasos SVG.
- `fuente/BRIEF.md`, `DIRECTIONS.md`, `SPEC.md`, `RESEARCH.md`: contexto del cliente, encargo de diseño de cada versión, requisitos comunes e investigación resumida.
- `fuente/research/`: las 6 líneas de investigación en JSON (cadenas de boba, inspiración visual, UX, apps de pedido, mercado, dirección de arte).
- `fuente/tools/`: batería común de pruebas con Playwright (`suite.js`), ensamblado de la página de propuestas y workflows de revisión.

## Pendiente de confirmar con Koi Tea

Precios y tamaños reales (los del prototipo son ilustrativos), el topping incluido, número de WhatsApp, tipo de cambio de la casa, ingredientes y alérgenos.
