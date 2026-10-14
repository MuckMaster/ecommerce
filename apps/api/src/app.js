
import express from "express";
import cors from "cors";
import helmet from "helmet";
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

// Cabeceras de seguridad en todas las respuestas (también las del webhook y las imágenes de /uploads),
// por eso va lo primero. Entre otras: quita X-Powered-By (no anunciar que es Express),
// X-Content-Type-Options: nosniff (el navegador no "adivina" el tipo de un archivo)
// y Cross-Origin-Resource-Policy: same-origin (otras webs no pueden incrustar nuestras imágenes).
app.use(helmet());

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

app.use(cors());
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