# Koi Tea · menú digital y pedidos

Sitio de producción de **Koi Tea Boba Shop** (Puerto Peñasco, Sonora): menú bilingüe (ES/EN) con precios en MXN y USD, estanque de koi en 3D, armador de bebida con vaso 3D, merch, pedido para llevar o en mesa, pago en barra o en línea, seguimiento en vivo y panel de administración para el dueño.

Construido con **Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Motion · three.js r187 · Zustand · Supabase · Stripe**.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3456 (puerto 3456 para no chocar con otros proyectos en el 3000)
npm run build && npm start
```

Sin configurar nada más, el sitio ya funciona: usa el menú estático de `src/lib/menu/data.ts` y los pedidos se mandan por WhatsApp (enlace `wa.me` con el pedido ya escrito).

## Base de datos local (Postgres en Docker)

Para trabajar con todo encendido (menú editable, pedidos guardados, seguimiento en vivo y panel) sin crear nada en la nube. Necesitas [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
npm run db:start   # levanta Postgres y los servicios de Supabase en Docker, aplica la migración y la semilla
npm run dev        # el sitio ya usa la base local
```

`db:start` usa la CLI de Supabase (incluida en las dependencias): corre Postgres 17 con la misma API, inicio de sesión y tiempo real que Supabase en la nube, así que el código es idéntico en local y en producción. Al terminar escribe `.env.local` con las claves locales y crea el usuario del panel:

| Qué | Dónde |
|---|---|
| Panel | http://localhost:3456/admin · `dueno@koitea.local` / `koitea-local` |
| Studio (ver y editar tablas) | http://127.0.0.1:55323 |
| Correos de prueba (enlace mágico) | http://127.0.0.1:55324 |
| Postgres directo | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |

Otros comandos:

```bash
npm run db:stop     # apaga los contenedores (los datos se conservan)
npm run db:reset    # borra todo y vuelve a aplicar migración + semilla (y recrea el usuario del panel)
npm run db:status   # URLs y claves de la base local
node scripts/local-db.mjs otro@correo.com su-contraseña   # otro usuario del panel
```

**Desde tu teléfono en la misma red Wi-Fi:** arranca con `npm run dev -- -H 0.0.0.0` y abre `http://IP-DE-TU-COMPUTADORA:3456`. El navegador del teléfono no puede llegar a `127.0.0.1`, así que cuando la base es local el sitio la expone en `/sb` (mismo dominio) y el panel, el inicio de sesión y el tiempo real pasan por ahí. En producción, con Supabase en la nube, ese puente no existe.

La configuración local vive en `supabase/config.toml` (sin almacenamiento de archivos ni funciones, registro público cerrado: solo el personal tiene cuenta) y la plantilla del enlace mágico en `supabase/templates/magic_link.html`. Las claves locales son las de demostración de Supabase: sirven solo en tu máquina.

## Variables de entorno

Copia `.env.example` a `.env.local`. Todo es opcional y se activa por capas:

| Capa | Variables | Qué habilita |
|---|---|---|
| Básica | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP` | URL pública y el WhatsApp de la barra al que llegan los pedidos. |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` | Menú editable, pedidos guardados con seguimiento en vivo (`/pedido/K-123`) y panel `/admin`. |
| Stripe (requiere Supabase) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Pago exprés (Apple Pay / Google Pay) y tarjeta con Stripe Checkout. Webhook: `/api/stripe/webhook` con los eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` y `checkout.session.expired`. |
| Mercado Pago (requiere Supabase) | `MP_ACCESS_TOKEN` | Checkout Pro. Webhook: `/api/mp/webhook` (tema *Pagos*). |
| WhatsApp Business API | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEAM_NUMBER`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_READY_TEMPLATE` | El pedido llega solo al WhatsApp del equipo con botones *Preparando · Listo · Entregado* (webhook `/api/whatsapp/webhook`, firmado con el App Secret) y, con una plantilla aprobada, aviso al cliente cuando está listo. |

El pago en línea solo se ofrece con Supabase configurado: el aviso del banco llega a otro proceso del servidor y necesita encontrar el pedido en la base de datos. Sin Supabase el sitio acepta pago en barra y el pedido se manda por WhatsApp.

Cómo funciona un pago en línea: el pedido se guarda como *pendiente*, el cliente paga en Stripe o Mercado Pago y, cuando llega el aviso del pago, el pedido aparece en el tablero (con campana) y en el WhatsApp del equipo. Si el cliente regresa sin pagar, su carrito sigue intacto y el pedido pendiente se cancela; si abandona la página de pago, caduca a los 30 minutos.

## Supabase (menú editable + pedidos + panel)

1. Crea un proyecto en [supabase.com](https://supabase.com) y abre el **SQL Editor**.
2. Ejecuta `supabase/migrations/20261106000000_init.sql` (tablas, RLS, tiempo real y la función `next_order_code`).
3. Ejecuta `supabase/seed.sql` (el menú actual; los precios son ilustrativos y se editan desde el panel).
4. En **Authentication → Users** crea el usuario del dueño (correo + contraseña) y agrégalo a la tabla `staff` (o pon su correo en `ADMIN_EMAILS` y se agrega solo la primera vez que entre):
   ```sql
   insert into public.staff (email, name) values ('correo@koitea.mx', 'Koi Tea');
   ```
5. Para que el enlace mágico por correo funcione aunque se abra en otro teléfono o navegador, en **Authentication → Emails → Magic Link** cambia el enlace de la plantilla por:
   ```html
   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink">Entrar al panel</a>
   ```
   y en **Authentication → URL Configuration** agrega `https://TU-DOMINIO/auth/callback` a las *Redirect URLs*.
6. Copia la URL, la clave anónima y la clave de servicio a las variables de entorno. Si cambias el menú y quieres regenerar la semilla: `npm run seed`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (framework: Next.js, raíz del proyecto: `/`).
2. Agrega las variables de entorno de arriba.
3. Al terminar, registra los webhooks de Stripe / Mercado Pago / WhatsApp con la URL de producción.

El menú se regenera cada 60 s y también al instante cuando el dueño guarda cambios en el panel.

## Estructura

```
src/app                  rutas: menú (/), seguimiento (/pedido/[code]), panel (/admin), API (/api/*)
src/components/menu      estanque, chips, tarjetas, fichas de bebida y merch, splash
src/components/cart      barra del pedido, flujo carrito → pago → confirmación, seguimiento
src/components/admin     panel: pedidos en vivo, editor de menú, ajustes
src/lib/menu             datos estáticos, tipos, helpers y repositorio (Supabase o respaldo)
src/lib/three            motores 3D: vaso (cup.ts), estanque con koi (pond.ts), merch (merch.ts), estanque 2D de respaldo
src/lib/orders           creación de pedidos, pagos, WhatsApp
src/lib/i18n             diccionario ES/EN
supabase/                migración y semilla
public/pantallas/        animaciones para las pantallas de la barra (build del proyecto hermano `pantallas/`)
pantallas/               código fuente de las pantallas (ver su README)
```

## Pantallas de la barra

El build de las animaciones vive en `public/pantallas/index.html`, así que se sirve en `/pantallas/`. En modo kiosco (Raspberry Pi, stick Android, mini PC):

```
https://TU-DOMINIO/pantallas/?screen=C&v=v1
https://TU-DOMINIO/pantallas/?screen=L&v=v3&gap=240
```

Para regenerarlo después de cambiar `pantallas/src`: `node pantallas/tools/build.cjs && cp pantallas/dist/index.html public/pantallas/index.html`.

## Notas

- Precios y tipo de cambio son **ilustrativos** hasta confirmarlos con el negocio; se cambian desde el panel sin tocar código.
- El 3D se carga solo cuando hace falta y respeta "reducir movimiento"; sin WebGL se muestra el vaso ilustrado y un estanque en Canvas 2D.
- Las tipografías se sirven desde el mismo dominio (Fontsource): ninguna petición sale a Google.
- Es una PWA instalable (`manifest.webmanifest` + `public/sw.js`): guarda el menú para abrir rápido con mala señal. Cada despliegue estrena su caché.
- El seguimiento de un pedido va en un enlace con secreto (`/pedido/K-123?t=…`): los códigos K-100…K-999 son cortos y se reciclan, así que sin el secreto nadie puede ver pedidos ajenos.
- Los íconos de la PWA se regeneran con `npm run icons` (usa `sharp`).
