
import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.routes.js"
import { productsRoutes } from "./modules/products/products.routes.js";
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
import { cartRoutes } from "./modules/cart/cart.routes.js";
import { contactRoutes } from "./modules/contact/contact.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { webhook } from "./modules/orders/orders.controller.js"

const app = express();

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

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use( "/api/cart", cartRoutes );
app.use("/api/contact", contactRoutes);
app.use("/api/orders", ordersRoutes);

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