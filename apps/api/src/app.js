
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { CORS_ORIGINS, TRUST_PROXY } from "./config/security.js";
import { authRoutes } from "./modules/auth/auth.routes.js"
import { productsRoutes } from "./modules/products/products.routes.js";
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
import { cartRoutes } from "./modules/cart/cart.routes.js";
import { contactRoutes } from "./modules/contact/contact.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { webhook } from "./modules/orders/orders.controller.js"
import { variantsRoutes } from "./modules/variants/variants.routes.js";
import { adminOrdersRoutes } from "./modules/admin/orders/admin-orders.routes.js";

const app = express();

// De qué IP viene cada petición (req.ip), que es lo que cuenta el límite de intentos.
// Ver parseTrustProxy en config/security.js: desactivado salvo que haya un proxy delante.
app.set("trust proxy", TRUST_PROXY);

// Cabeceras de seguridad en todas las respuestas (también las del webhook y las imágenes de /uploads),
// por eso va lo primero. Entre otras: quita X-Powered-By (no anunciar que es Express),
// X-Content-Type-Options: nosniff (el navegador no "adivina" el tipo de un archivo)
// y Cross-Origin-Resource-Policy: same-origin (otras webs no pueden incrustar nuestras imágenes).
// Excepción: si CORS_ORIGINS tiene orígenes, el frontend está en otro dominio y sus <img> de /uploads
// también son "otra web". Un <img> no pasa por CORS sino por esta cabecera, así que con same-origin
// el navegador bloquearía las fotos aunque CORS esté bien. En ese caso se relaja a cross-origin.
if (CORS_ORIGINS.length > 0) {
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
} else {
    app.use(helmet());
}

// Disclaimer: El webhook de stripe esta registrado aquí y no en orders.routes.js ya que Stripe necesita el body sin parsear (raw) para confirmar la firma de seguridad.
// En caso de estar en router, express.json() procesa el body antes y la confirmacion de la firma falla.
app.post(
    "/api/orders/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
        console.log("WEBHOOK HIT - body type:", typeof req.body, "is Buffer:", Buffer.isBuffer(req.body));
        next()
    },
    webhook
);

// CORS solo si CORS_ORIGINS trae orígenes. Antes era cors() a secas, que responde
// "Access-Control-Allow-Origin: *": cualquier web podía llamar a la API desde el navegador de un visitante.
// Con una lista, cors responde con el origen de la petición solo si está en ella; si no, no pone la cabecera
// y el navegador bloquea la respuesta. Sin la variable no hace falta: el frontend va en el mismo dominio.
if (CORS_ORIGINS.length > 0) {
    app.use(cors({ origin: CORS_ORIGINS }));
}
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use( "/api/cart", cartRoutes );
app.use("/api/contact", contactRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/variants", variantsRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);

app.get("/health", async (req, res) => {

    try {
        const { prisma } = await import ("./lib/prisma.js");
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, db: "connected" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "db_connection_failed" });
    }

});

export { app };