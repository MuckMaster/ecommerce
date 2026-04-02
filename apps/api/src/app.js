
import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.routes.js"
import { productsRoutes } from "./modules/products/products.routes.js"
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
import { cartRoutes } from "./modules/cart/cart.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use( "/api/cart", cartRoutes );

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