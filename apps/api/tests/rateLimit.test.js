import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { parseTrustProxy } from "../src/config/security.js";

// Hace un login con una contraseña incorrecta (email que no existe): la API responde 401.
const failLogin = async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nadie@example.com", password: "incorrecta" });
    return res;
};

// Repite failLogin las veces indicadas, una detrás de otra, y devuelve la última respuesta.
const failLoginTimes = async (times) => {
    let res;
    for (let i = 0; i < times; i++) {
        res = await failLogin();
    }
    return res;
};

describe("límite de intentos en el login", () => {
    it("deja 10 fallos y al 11 responde 429 con { error }", async () => {
        const tenthAttempt = await failLoginTimes(10);
        expect(tenthAttempt.status).toBe(401);

        const eleventhAttempt = await failLogin();

        expect(eleventhAttempt.status).toBe(429);
        expect(eleventhAttempt.body).toEqual({ error: "Too many failed login attempts, please try again later" });
    });

    it("después del primer 429 sigue bloqueado: el descuento del 429 no desbloquea", async () => {
        // El 429 no es un 401, así que requestWasSuccessful lo trata como "éxito" y la librería
        // lo descuenta al terminar. El contador vuelve a 10 tras cada bloqueo, no baja de ahí,
        // y el siguiente intento lo sube otra vez a 11: sigue por encima del límite.
        await failLoginTimes(10);
        const eleventhAttempt = await failLogin();
        expect(eleventhAttempt.status).toBe(429);

        const twelfthAttempt = await failLogin();
        const thirteenthAttempt = await failLogin();

        expect(twelfthAttempt.status).toBe(429);
        expect(thirteenthAttempt.status).toBe(429);
    });

    it("los logins correctos no gastan intentos", async () => {
        // Un usuario de verdad, con la contraseña cifrada igual que en el registro
        const password_hash = await bcrypt.hash("secreta123", 10);
        await prisma.users.create({ data: { name: "Ana", email: "ana@example.com", password_hash } });

        for (let i = 0; i < 12; i++) {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "ana@example.com", password: "secreta123" });
            expect(res.status).toBe(200);
        }

        // Tras 12 éxitos todavía quedan los 10 fallos enteros
        const res = await failLoginTimes(10);
        expect(res.status).toBe(401);
    });

    it("las peticiones con campos que faltan (400) no gastan intentos", async () => {
        for (let i = 0; i < 12; i++) {
            const res = await request(app).post("/api/auth/login").send({});
            expect(res.status).toBe(400);
        }

        const res = await failLogin();
        expect(res.status).toBe(401);
    });

    it("sin TRUST_PROXY, inventarse X-Forwarded-For no salta el límite", async () => {
        // Cada petición dice venir de una IP distinta; como no hay proxy, la API la ignora
        for (let i = 0; i < 10; i++) {
            await request(app)
                .post("/api/auth/login")
                .set("X-Forwarded-For", `203.0.113.${i}`)
                .send({ email: "nadie@example.com", password: "incorrecta" });
        }

        const res = await request(app)
            .post("/api/auth/login")
            .set("X-Forwarded-For", "203.0.113.99")
            .send({ email: "nadie@example.com", password: "incorrecta" });

        expect(res.status).toBe(429);
    });
});

// Se mandan peticiones sin campos (400) para no crear cuentas ni enviar correos:
// en estas dos rutas cuentan todas las peticiones, también las que fallan.
describe("límite de intentos en registro y contacto", () => {
    it("registro: deja 5 por hora y a la 6 responde 429", async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app).post("/api/auth/register").send({});
            expect(res.status).toBe(400);
        }

        const res = await request(app).post("/api/auth/register").send({});

        expect(res.status).toBe(429);
        expect(res.body).toEqual({ error: "Too many registration attempts, please try again later" });
    });

    it("contacto: deja 5 por hora y a la 6 responde 429", async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app).post("/api/contact").send({});
            expect(res.status).toBe(400);
        }

        const res = await request(app).post("/api/contact").send({});

        expect(res.status).toBe(429);
        expect(res.body).toEqual({ error: "Too many messages, please try again later" });
    });
});

// Estos dos tests van juntos y en este orden, como los de la limpieza de la base en app.test.js:
// el primero agota los tres límites y el segundo comprueba que el beforeEach de setup.js
// los ha puesto a cero.
describe("los contadores empiezan a cero en cada test", () => {
    it("agota los límites de login, registro y contacto", async () => {
        await failLoginTimes(10);
        for (let i = 0; i < 5; i++) {
            await request(app).post("/api/auth/register").send({});
            await request(app).post("/api/contact").send({});
        }

        expect((await failLogin()).status).toBe(429);
        expect((await request(app).post("/api/auth/register").send({})).status).toBe(429);
        expect((await request(app).post("/api/contact").send({})).status).toBe(429);
    });

    it("el siguiente test vuelve a tener todos los intentos", async () => {
        expect((await failLogin()).status).toBe(401);
        expect((await request(app).post("/api/auth/register").send({})).status).toBe(400);
        expect((await request(app).post("/api/contact").send({})).status).toBe(400);
    });
});

// La lectura de la variable TRUST_PROXY.
describe("parseTrustProxy", () => {
    it("devuelve false si la variable no existe o está vacía", () => {
        expect(parseTrustProxy(undefined)).toBe(false);
        expect(parseTrustProxy("")).toBe(false);
        expect(parseTrustProxy("  ")).toBe(false);
    });

    it("devuelve el número de proxies", () => {
        expect(parseTrustProxy("1")).toBe(1);
        expect(parseTrustProxy(" 2 ")).toBe(2);
    });

    it("rechaza lo que no sea un número entero de 0 en adelante", () => {
        expect(() => parseTrustProxy("true")).toThrow("TRUST_PROXY");
        expect(() => parseTrustProxy("-1")).toThrow("TRUST_PROXY");
        expect(() => parseTrustProxy("1.5")).toThrow("TRUST_PROXY");
    });
});
