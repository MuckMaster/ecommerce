import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { JWT_SECRET, requireJwtSecret } from "../src/config/security.js";

// La comprobación que impide arrancar la API sin JWT_SECRET.
describe("requireJwtSecret", () => {
    it("lanza un error si la clave no existe o está vacía", () => {
        expect(() => requireJwtSecret(undefined)).toThrow("Falta JWT_SECRET");
        expect(() => requireJwtSecret("")).toThrow("Falta JWT_SECRET");
        expect(() => requireJwtSecret("   ")).toThrow("Falta JWT_SECRET");
    });

    it("lanza un error distinto si la clave tiene menos de 32 caracteres", () => {
        const shortSecret = "a".repeat(31);

        expect(() => requireJwtSecret(shortSecret)).toThrow("demasiado corta (31 caracteres, mínimo 32)");
        expect(() => requireJwtSecret(shortSecret)).toThrow("randomBytes(48)");
    });

    it("devuelve la clave si tiene 32 caracteres o más", () => {
        const secret = "a".repeat(32);

        expect(requireJwtSecret(secret)).toBe(secret);
    });
});

// Comprueba con una ruta protegida de verdad (GET /api/auth/me) que solo valen
// los tokens firmados con JWT_SECRET, y ya no los firmados con la antigua clave de serie.
describe("tokens JWT en rutas protegidas", () => {
    // Crea un usuario en la base de tests y le firma un token con la clave indicada,
    // igual que hace auth.service.js al hacer login.
    const createUserWithToken = async (secret) => {
        const user = await prisma.users.create({
            data: { name: "Ana", email: "ana@example.com", password_hash: "no_se_usa_en_este_test" },
        });
        const token = jwt.sign({ userId: String(user.id), role: user.role }, secret, { expiresIn: "15m" });
        return token;
    };

    it("acepta un token firmado con JWT_SECRET", async () => {
        const token = await createUserWithToken(JWT_SECRET);

        const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe("ana@example.com");
    });

    it("rechaza un token firmado con la antigua clave de serie", async () => {
        const token = await createUserWithToken("dev_secret_change_in_prod");

        const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Invalid or expired token" });
    });
});
