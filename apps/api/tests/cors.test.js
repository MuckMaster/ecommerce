import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { parseCorsOrigins } from "../src/config/security.js";

// La lectura de la variable CORS_ORIGINS.
describe("parseCorsOrigins", () => {
    it("devuelve una lista vacía si la variable no existe o está vacía", () => {
        expect(parseCorsOrigins(undefined)).toEqual([]);
        expect(parseCorsOrigins("")).toEqual([]);
        expect(parseCorsOrigins("  ,  ")).toEqual([]);
    });

    it("separa por comas y quita los espacios", () => {
        const origins = parseCorsOrigins(" https://tienda.com ,http://localhost:5173");

        expect(origins).toEqual(["https://tienda.com", "http://localhost:5173"]);
    });

    it("rechaza un origen con / al final, con ruta o que no es una URL", () => {
        expect(() => parseCorsOrigins("https://tienda.com/")).toThrow('"https://tienda.com/"');
        expect(() => parseCorsOrigins("https://tienda.com/api")).toThrow("mal escrito");
        expect(() => parseCorsOrigins("tienda.com")).toThrow("mal escrito");
        expect(() => parseCorsOrigins("*")).toThrow("mal escrito");
    });
});

// Carga la app de nuevo con el CORS_ORIGINS indicado.
// Hace falta porque la lista se lee al importar src/config/security.js, una sola vez:
// vi.resetModules() vacía la caché de módulos para que el import vuelva a leer la variable.
const loadAppWithCorsOrigins = async (corsOrigins) => {
    process.env.CORS_ORIGINS = corsOrigins;
    vi.resetModules();
    const { app } = await import("../src/app.js");
    return app;
};

// Se usa /uploads con un archivo inexistente (404) para no tocar la base de datos:
// las cabeceras CORS se ponen antes de llegar a la ruta, así que da igual la respuesta.
describe("cabeceras CORS en la app", () => {
    it("sin CORS_ORIGINS no pone Access-Control-Allow-Origin, ni siquiera el * de antes", async () => {
        const app = await loadAppWithCorsOrigins("");

        const res = await request(app).get("/uploads/no-existe.jpg").set("Origin", "https://otra-web.com");

        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("con CORS_ORIGINS responde con el origen si está en la lista", async () => {
        const app = await loadAppWithCorsOrigins("https://tienda.com,http://localhost:5173");

        const res = await request(app).get("/uploads/no-existe.jpg").set("Origin", "http://localhost:5173");

        expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    });

    it("con CORS_ORIGINS no pone la cabecera a un origen que no está en la lista", async () => {
        const app = await loadAppWithCorsOrigins("https://tienda.com");

        const res = await request(app).get("/uploads/no-existe.jpg").set("Origin", "https://otra-web.com");

        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("responde a la petición previa (preflight) del navegador y deja pasar X-Session-Id", async () => {
        const app = await loadAppWithCorsOrigins("https://tienda.com");

        // Antes de un POST con cabeceras propias, el navegador pregunta con OPTIONS si puede hacerlo
        const res = await request(app)
            .options("/api/cart")
            .set("Origin", "https://tienda.com")
            .set("Access-Control-Request-Method", "POST")
            .set("Access-Control-Request-Headers", "content-type,x-session-id");

        expect(res.status).toBe(204);
        expect(res.headers["access-control-allow-origin"]).toBe("https://tienda.com");
        expect(res.headers["access-control-allow-headers"]).toContain("x-session-id");
    });

    it("con CORS_ORIGINS permite credenciales, para que viaje la cookie del refresh token", async () => {
        const app = await loadAppWithCorsOrigins("https://tienda.com");

        const res = await request(app).get("/uploads/no-existe.jpg").set("Origin", "https://tienda.com");

        // Sin esta cabecera, el navegador descarta la respuesta de un fetch con credentials: 'include'
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });
});

// La cabecera Cross-Origin-Resource-Policy de helmet depende de CORS_ORIGINS:
// con el frontend en otro dominio, sus <img> de /uploads tienen que poder cargarse.
describe("Cross-Origin-Resource-Policy en /uploads según CORS_ORIGINS", () => {
    it("sin CORS_ORIGINS se queda en same-origin", async () => {
        const app = await loadAppWithCorsOrigins("");

        const res = await request(app).get("/uploads/no-existe.jpg");

        expect(res.headers["cross-origin-resource-policy"]).toBe("same-origin");
    });

    it("con CORS_ORIGINS pasa a cross-origin", async () => {
        const app = await loadAppWithCorsOrigins("https://tienda.com");

        const res = await request(app).get("/uploads/no-existe.jpg");

        expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
        // El resto de helmet sigue igual
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });
});
