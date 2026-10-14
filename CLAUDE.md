\# E-commerce base (Node)



Base reutilizable de tienda online. De aquí salen variantes con `git clone` desde un tag `base-node-vN`.

En esta base solo entran mejoras que valgan para cualquier tienda. Lo propio de una tienda concreta (marca, diseño, claves) va en su variante.



\## Estructura

\- `apps/api/` → API: Node 20 + Express 5 + Prisma 5 + MySQL 8.

\- `apps/frontend/` → React + Vite. Tienda y panel de admin (`/admin/\*`) en la misma app.

\- `infra/docker/` → docker-compose.yml.

\- `infra/db/migrations/` → esquema de la base de datos en SQL, numerado.

\- `apps/admin/` y `packages/` están vacíos: no buscar código ahí.



\## Comandos

\- Docker, siempre desde `infra/docker/`: `docker compose up -d`.

\- Logs de la API: `docker logs ecommerce\_bolsos\_api --tail 30`.

\- Si cambia schema.prisma o un contenedor se crea de cero: `docker compose up -d --build -V api` (regenera el cliente de Prisma).

\- Frontend: `npm run dev` desde `apps/frontend/`.

\- Puertos: API 3000, frontend 5173, MySQL 3307 en el host.



\## Contrato de la API

\- IDs como string en el JSON (en la base de datos son BigInt).

\- Precios: `price\_cents` (entero) en la base de datos; la API recibe y devuelve euros en `price`. La conversión se hace en el service.

\- Errores siempre `{ "error": "mensaje" }`, nunca `message`.

\- Estados de pedido: PENDING, PAID, SHIPPED, CANCELLED, REFUNDED. Producto: DRAFT, PUBLISHED. Roles: USER, ADMIN.

\- Listados de admin: `{ data: \[...], pagination: { total, page, limit, pages } }`.

\- Borrar un producto es soft delete (`deleted\_at`).

\- Las variantes se devuelven con `name` (el color) y `css`, no con `color` y `color\_css`.

\- Carrito anónimo con la cabecera `X-Session-Id`; se fusiona con el del usuario al registrarse, no al hacer login.



\## Arquitectura de la API

\- Cada módulo: `x.routes.js` (URL y middlewares) → `x.controller.js` (petición, validación, errores HTTP) → `x.service.js` (lógica y Prisma).

\- Las rutas fijas van antes que las de parámetro (`/search` y `/stats` antes de `/:id`).

\- El webhook de Stripe se registra en `app.js`, antes de `express.json()`, con `express.raw()`. No moverlo al router: la firma se verifica sobre el body sin parsear.

\- Middlewares: `authMiddleware` (exige JWT), `optionalAuth` (no lo exige; lee también `X-Session-Id`), `requireRole("ADMIN")`.

\- `app.js` (la app) está separado de `server.js` (arranca el servidor). Mantenerlo así: los tests importan `app` directamente.

\- Marca de la tienda en `src/config/brand.js` (`STORE\_NAME`, `ORDER\_PREFIX`). El resto del código no lee esas variables de `process.env`: las importa de ahí.



\## Base de datos y Prisma

\- NO usar `prisma migrate`. Para cambiar el esquema: nuevo archivo SQL numerado en `infra/db/migrations/`, aplicarlo, y luego `prisma db pull` y `prisma generate` dentro del contenedor de la API.

\- Prisma se queda en la v5 (la v7 dio problemas con los adapters). Por eso la imagen es `node:20-slim` con openssl instalado.

\- `nodemon --legacy-watch` es necesario: Docker en Windows no avisa de los cambios de archivos.

\- Una dependencia nueva tiene que quedar en package.json y reconstruirse la imagen, o desaparece al recrear el contenedor.



\## Frontend

\- `src/config.js` centraliza `API\_URL` y `ASSET\_URL` (por defecto `http://localhost:3000`).

\- La marca también sale de `src/config.js`: `STORE\_NAME` y `STORE\_EMAIL` (de `VITE\_STORE\_NAME` y `VITE\_STORE\_EMAIL`). El `<title>` de `index.html` usa `%VITE\_STORE\_NAME%`. Logo en `public/images/logo/logo.png` y favicon en `public/images/logo/favicon.png`: cada variante cambia los archivos.

\- El access token vive en memoria; en localStorage están `user`, `refreshToken` y `sessionId`.

\- CSS con BEM: `bloque\_\_elemento--modificador`.



\## Plan en curso (actualizar al cerrar cada paso)

1\. ✅ Marca configurable: nombre de la tienda, prefijo de pedido, remitente del correo → variables de entorno.

2\. API en el mismo dominio que el frontend: rutas relativas (`/api`, `/uploads`) y proxy de Vite en local.

3\. Seguridad: límite de intentos en el login, CORS por variable de entorno, JWT\_SECRET obligatorio, helmet, refresh token en cookie httpOnly, admin cargado con React.lazy. Empezar montando tests con Vitest y Supertest.

4\. Tag `base-node-v2` y crear la variante `concept-commerce`.

Pendiente para más adelante:

\- Quitar "Bolsos de" de `Navbar.jsx:179` al hacer la variante genérica.

\- Borrar los logos duplicados: `public/logo\_rivet.png` y `public/images/logo/logo\_rivet copy.png`.

