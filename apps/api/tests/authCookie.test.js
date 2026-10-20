import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { buildRefreshCookieOptions } from "../src/config/security.js";

// Crea un usuario con la contraseña cifrada igual que en el registro.
const createUser = async () => {
    const password_hash = await bcrypt.hash("secreta123", 10);
    await prisma.users.create({ data: { name: "Ana", email: "ana@example.com", password_hash } });
};

// Busca en una respuesta la cabecera Set-Cookie del refresh token y la devuelve entera
// ("refreshToken=abc...; Max-Age=...; Path=/api/auth; HttpOnly; ..."), o undefined si no está.
const findRefreshSetCookie = (res) => {
    const cookies = res.headers["set-cookie"] || [];
    return cookies.find((cookie) => cookie.startsWith("refreshToken="));
};

// Devuelve solo "refreshToken=abc...", que es lo que el navegador manda de vuelta en la cabecera Cookie.
const getRefreshCookie = (res) => {
    const setCookie = findRefreshSetCookie(res);
    return setCookie.split(";")[0];
};

// Hace login con el usuario de createUser y devuelve la respuesta.
const login = async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "ana@example.com", password: "secreta123" });
    return res;
};

// Llama a /refresh enviando la cookie indicada, como haría el navegador.
const refreshWith = async (cookie) => {
    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    return res;
};

describe("refresh token en cookie httpOnly", () => {
    it("el login pone la cookie con HttpOnly, SameSite=Strict y Path=/api/auth, y no la devuelve en el JSON", async () => {
        await createUser();

        const res = await login();

        expect(res.status).toBe(200);
        const setCookie = findRefreshSetCookie(res);
        expect(setCookie).toContain("HttpOnly");
        expect(setCookie).toContain("SameSite=Strict");
        expect(setCookie).toContain("Path=/api/auth");
        // Fuera de producción (los tests corren con NODE_ENV=test) no lleva Secure, o no viajaría por http
        expect(setCookie).not.toContain("Secure");
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeUndefined();
    });

    it("el registro también pone la cookie y no devuelve el token en el JSON", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ name: "Luis", email: "luis@example.com", password: "secreta123" });

        expect(res.status).toBe(201);
        expect(findRefreshSetCookie(res)).toContain("HttpOnly");
        expect(res.body.refreshToken).toBeUndefined();
    });

    it("el refresh con la cookie da un accessToken y una cookie nueva distinta", async () => {
        await createUser();
        const oldCookie = getRefreshCookie(await login());

        const res = await refreshWith(oldCookie);

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeUndefined();
        const newCookie = getRefreshCookie(res);
        expect(newCookie).not.toBe(oldCookie);
    });

    it("rotación: la cookie vieja ya no vale después de un refresh, la nueva sí", async () => {
        await createUser();
        const oldCookie = getRefreshCookie(await login());
        const newCookie = getRefreshCookie(await refreshWith(oldCookie));

        const withOld = await refreshWith(oldCookie);
        const withNew = await refreshWith(newCookie);

        expect(withOld.status).toBe(401);
        expect(withOld.body).toEqual({ error: "Invalid or expired refresh token" });
        expect(withNew.status).toBe(200);
    });

    it("dos refresh a la vez con la misma cookie: uno gana (200) y el otro recibe 401", async () => {
        await createUser();
        const cookie = getRefreshCookie(await login());

        // Promise.all lanza las dos peticiones sin esperar a que acabe la primera
        const responses = await Promise.all([refreshWith(cookie), refreshWith(cookie)]);
        const statuses = responses.map((res) => res.status).sort();

        expect(statuses).toEqual([200, 401]);
        // Sigue habiendo una sola sesión: la rotación actualiza la fila, no crea otra
        const sessions = await prisma.user_sessions.count();
        expect(sessions).toBe(1);
    });

    it("el refresh sin cookie da 401 con { error }", async () => {
        const res = await request(app).post("/api/auth/refresh");

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Invalid or expired refresh token" });
    });

    it("el logout borra la cookie y la sesión: después esa cookie da 401", async () => {
        await createUser();
        const cookie = getRefreshCookie(await login());

        const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);

        expect(res.status).toBe(200);
        // Borrar una cookie es mandarla vacía y con una fecha de caducidad ya pasada
        const setCookie = findRefreshSetCookie(res);
        expect(setCookie).toContain("refreshToken=;");
        expect(setCookie).toContain("Path=/api/auth");
        expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");

        const afterLogout = await refreshWith(cookie);
        expect(afterLogout.status).toBe(401);
    });

    it("logout sin cookie → 200 y Set-Cookie que la borra", async () => {
        const res = await request(app).post("/api/auth/logout");

        expect(res.status).toBe(200);
        const setCookie = findRefreshSetCookie(res);
        expect(setCookie).toContain("refreshToken=;");
        expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
    });

    it("si el service falla, el logout responde 500 pero borra la cookie igualmente", async () => {
        await createUser();
        const cookie = getRefreshCookie(await login());
        // Simula que la base de datos falla al borrar la sesión
        const spy = vi.spyOn(prisma.user_sessions, "deleteMany").mockRejectedValueOnce(new Error("DB caída"));
        // El controller hace console.error del fallo: se silencia para no ensuciar la salida del test
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);

        spy.mockRestore();
        consoleSpy.mockRestore();
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Internal server error" });
        expect(findRefreshSetCookie(res)).toContain("refreshToken=;");
    });
});

// Las opciones de la cookie según NODE_ENV: Secure solo en producción.
describe("buildRefreshCookieOptions", () => {
    it("en producción la cookie es Secure", () => {
        const options = buildRefreshCookieOptions("production");

        expect(options.secure).toBe(true);
    });

    it("fuera de producción no es Secure (en local vamos por http)", () => {
        expect(buildRefreshCookieOptions("development").secure).toBe(false);
        expect(buildRefreshCookieOptions(undefined).secure).toBe(false);
    });

    it("dura lo mismo que la sesión en la base de datos: 30 días", () => {
        const options = buildRefreshCookieOptions("production");

        expect(options.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
    });
});
