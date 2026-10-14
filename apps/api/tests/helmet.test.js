import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

// Comprueba que helmet pone las cabeceras de seguridad en las respuestas de la API.
// Supertest devuelve los nombres de las cabeceras en minúsculas.
describe("cabeceras de seguridad (helmet)", () => {
    it("no anuncia que la API es Express", async () => {
        const res = await request(app).get("/health");

        expect(res.headers["x-powered-by"]).toBeUndefined();
    });

    it("pone las cabeceras básicas en una ruta de la API", async () => {
        const res = await request(app).get("/health");

        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(res.headers["cross-origin-resource-policy"]).toBe("same-origin");
        expect(res.headers["strict-transport-security"]).toContain("max-age=");
        expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    });

    it("también las pone en /uploads, aunque el archivo no exista", async () => {
        // Se pide un archivo inexistente para no depender de imágenes reales en la carpeta uploads
        const res = await request(app).get("/uploads/no-existe.jpg");

        expect(res.status).toBe(404);
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["cross-origin-resource-policy"]).toBe("same-origin");
    });
});
