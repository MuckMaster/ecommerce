
import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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