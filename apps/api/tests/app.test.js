import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Primeros tests de humo: comprueban que la app arranca en los tests,
// que llega a la base de datos y que la limpieza entre tests funciona.
describe("app", () => {
    it("GET /health responde ok y conectado a la base de datos", async () => {
        const res = await request(app).get("/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, db: "connected" });
    });

    it("una ruta que no existe devuelve 404", async () => {
        const res = await request(app).get("/api/no-existe");

        expect(res.status).toBe(404);
    });
});

// Estos dos tests van juntos y en este orden: el primero guarda una fila
// y el segundo comprueba que el beforeEach de setup.js la ha borrado.
describe("limpieza de la base de datos entre tests", () => {
    it("guarda un mensaje de contacto", async () => {
        await prisma.contact_messages.create({
            data: { name: "Ana", email: "ana@example.com", message: "Hola" },
        });

        const total = await prisma.contact_messages.count();
        expect(total).toBe(1);
    });

    it("el siguiente test empieza con la tabla vacía", async () => {
        const total = await prisma.contact_messages.count();
        expect(total).toBe(0);
    });
});
