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

\- Login y register devuelven `{ user, accessToken }`; el refresh token va en la cookie httpOnly `refreshToken` (`Path=/api/auth`, `SameSite=Strict`, `Secure` con `NODE\_ENV=production`), nunca en el JSON. `/refresh` y `/logout` la leen de la cookie, sin body. Opciones de la cookie en `src/config/security.js`.



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

\- `src/config.js` centraliza `API\_URL` (de `VITE\_API\_URL`, opcional). Vacía por defecto: el frontend pide rutas relativas (`/api`, `/uploads`) al mismo dominio. `imageUrl()` también usa `API\_URL`, porque la API sirve `/uploads`.

\- En local, el proxy de `vite.config.js` reenvía `/api` y `/uploads` a `localhost:3000`, tanto con `npm run dev` como con `npm run preview` (preview usa `server.proxy` si no se define `preview.proxy`).

\- En producción hace falta un servidor web (Nginx/Caddy) que sirva el frontend y reenvíe `/api` y `/uploads` a la API. Ver "Despliegue" en "Pendiente para más adelante".

\- La marca también sale de `src/config.js`: `STORE\_NAME` y `STORE\_EMAIL` (de `VITE\_STORE\_NAME` y `VITE\_STORE\_EMAIL`). El `<title>` de `index.html` usa `%VITE\_STORE\_NAME%`. Logo en `public/images/logo/logo.png` y favicon en `public/images/logo/favicon.png`: cada variante cambia los archivos.

\- El access token vive en memoria y el refresh token en una cookie httpOnly que JavaScript no ve; en localStorage están `user` y `sessionId`. `user` sirve también de pista: sin él no se llama a `/refresh`.

\- En `AuthContext.jsx`, `refresh()` nunca lanza dos peticiones a la vez (con la rotación, la segunda llegaría con la llave gastada). Solo un 401 del refresh desloguea; un error de red o un 5xx devuelve null sin borrar nada.

\- CSS con BEM: `bloque\_\_elemento--modificador`.



\## Plan en curso (actualizar al cerrar cada paso)

1\. Marca configurable: nombre de la tienda, prefijo de pedido, remitente del correo → variables de entorno. (hecho)

2\. API en el mismo dominio que el frontend: rutas relativas (`/api`, `/uploads`) y proxy de Vite en local. (hecho)

3\. Seguridad: límite de intentos en el login, CORS por variable de entorno, JWT\_SECRET obligatorio, helmet, refresh token en cookie httpOnly, admin cargado con React.lazy. Empezar montando tests con Vitest y Supertest. En bloques:

   \- B1. Vitest y Supertest con base de datos de tests. (hecho)

   \- B2. JWT\_SECRET obligatorio, mínimo 32 caracteres, en `src/config/security.js`. (hecho)

   \- B3. helmet. (hecho)

   \- B4. CORS con `CORS\_ORIGINS`: lista separada por comas; vacía = sin CORS. Si tiene orígenes, helmet pasa Cross-Origin-Resource-Policy a `cross-origin` para que el frontend cargue las imágenes de `/uploads`. (hecho)

   \- B5. express-rate-limit, con 429 `{ "error": "..." }`. Login: 10 fallos cada 15 min por IP, contando solo los fallos. Register y contact: 5 por hora por IP, contando todas. `TRUST\_PROXY` desactivado por defecto. Límites en `src/middlewares/rateLimit.middleware.js`, en memoria; en el login solo cuenta el 401. `setup.js` los pone a cero antes de cada test. (hecho)

   \- B6. Refresh token en cookie httpOnly (cookie-parser), con rotación. `NODE\_ENV=production` activa `Secure`. Rotación con `updateMany` condicionado al hash viejo (count 0 → 401). El 401 del refresh no borra la cookie; el logout la borra siempre, también sin cookie o si falla el service. CORS con `credentials: true` y el frontend con `credentials: 'include'`. Frontend: borrar la clave vieja `refreshToken` de localStorage y arreglar el `headers` duplicado de `logout()` en `AuthContext.jsx`.

   \- B7. Admin con React.lazy. Medir el build antes y después (hoy un único JS de 431 KB).

   \- B8. `.env.example` con `CORS\_ORIGINS`, `TRUST\_PROXY`, `NODE\_ENV` y lo nuevo. El comentario de `TRUST\_PROXY` tiene que avisar de que, detrás de Nginx/Caddy sin `TRUST\_PROXY=1`, todos los clientes comparten la IP del proxy y el mismo contador, y un atacante bloquearía el login de todos. Marcar el paso 3 como hecho.

   \- Tests: `docker exec ecommerce\_bolsos\_api npm test`, contra la base `ecommerce\_bolsos\_test` (el setup aborta si el nombre no acaba en `\_test`).

   \- Dependencias: instalar en cada bloque solo la suya y reconstruir la imagen. Si `npm install` de npm 10 falla (`edgesOut`), usar `npx -y npm@11 install ...`.

4\. Tag `base-node-v2` y crear la variante `concept-commerce`.

Pendiente para más adelante:

\- Quitar "Bolsos de" de `Navbar.jsx:179` al hacer la variante genérica.

\- Borrar los logos duplicados: `public/logo\_rivet.png` y `public/images/logo/logo\_rivet copy.png`.

\- Despliegue con Nginx/Caddy delante de Node: se hace con la primera variante (concept-commerce).

\- Migración 011 que borre de la base de desarrollo las 8 tablas que dejó Laravel (`cache`, `cache\_locks`, `failed\_jobs`, `job\_batches`, `jobs`, `migrations`, `password\_reset\_tokens`, `sessions`), seguida de `prisma db pull`, para que el esquema se pueda reconstruir solo con las migraciones.

\- Borrar periódicamente las sesiones caducadas de `user\_sessions` (hoy solo se borran si alguien intenta usarlas).

\- Refresh token: detección de reutilización. Si llega una llave ya rotada, es que alguien la copió: cerrar todas las sesiones de ese usuario. Necesita guardar las llaves usadas (cambio de esquema).

\- Refresh token: carrera entre pestañas. Dos pestañas que refrescan a la vez comparten cookie; la que pierde recibe 401 y se desloguea en su estado, aunque la otra tenga una llave válida. La deduplicación de `AuthContext.jsx` solo cubre una pestaña (posible solución: BroadcastChannel o Web Locks).

\- Refresh token: tope absoluto de sesión. Cada refresh alarga la sesión 30 días, así que un usuario activo no caduca nunca. No renovar pasado un máximo desde el login (por ejemplo, 90 días). No necesita cambio de esquema: la rotación actualiza la misma fila, así que `created\_at` de `user\_sessions` ya es la fecha del login.

\- Quitar el `console.log("WEBHOOK HIT…")` de depuración de `app.js`.

\- Aviso de seguridad en `body-parser` (va con Express): revisar npm audit y actualizar dependencias (Express incluido) antes del tag base-node-v2 del paso 4.

