import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {

    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, db: "connected"});
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "db_connection_failed" });
    }

});


app.listen(3000, () => {

    console.log("API running on http://localhost:3000");

})
