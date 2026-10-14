// Preparación común a todos los tests de la API.
// Vitest lo ejecuta antes de cada archivo de test (setupFiles en vitest.config.js),
// así que lo que se pone aquí en process.env ya está listo cuando el test importa la app.
import { beforeEach, afterAll } from "vitest";
import { buildTestDatabaseUrl, isTestDatabaseUrl } from "./helpers/test-database.js";

// --- 1. Base de datos de tests ---
// Sin DATABASE_URL no se sabe a qué servidor conectarse. Los tests se ejecutan
// dentro del contenedor de la API, que la recibe de .env.docker.
if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL. Ejecuta los tests dentro del contenedor: docker exec ecommerce_bolsos_api npm test");
}

process.env.DATABASE_URL = buildTestDatabaseUrl(process.env.DATABASE_URL);

// Protección: si por lo que sea la URL no apunta a una base "_test", se aborta antes
// de conectar. Los tests vacían las tablas y eso nunca puede pasar en la base de desarrollo.
if (!isTestDatabaseUrl(process.env.DATABASE_URL)) {
    throw new Error("Los tests solo pueden usar una base de datos cuyo nombre termine en _test");
}

// --- 2. Stripe ---
// La app crea el cliente de Stripe al importarse y falla si no hay clave.
// Se pone siempre una falsa para que ningún test pueda llamar a Stripe de verdad.
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_tests";

// --- 3. JWT ---
// La API no arranca sin JWT_SECRET (src/config/security.js). Los tests usan una clave
// fija y propia para no depender de la de .env.docker ni dejarla en ningún token de prueba.
// Tiene que cumplir el mínimo de 32 caracteres.
process.env.JWT_SECRET = "jwt_secret_only_for_tests_with_more_than_32_chars";

// Prisma se importa después de cambiar DATABASE_URL (por eso con import dinámico:
// un import normal se ejecutaría antes que el código de arriba).
const { prisma } = await import("../src/lib/prisma.js");

// Vacía todas las tablas de la base de tests para que cada test empiece desde cero
// y no dependa de lo que dejó el anterior.
const cleanDatabase = async () => {
    // Segunda comprobación, ya contra MySQL: el nombre de la base a la que de verdad estamos conectados
    const result = await prisma.$queryRaw`SELECT DATABASE() AS name`;
    const connectedDatabase = result[0].name;
    if (!connectedDatabase.endsWith("_test")) {
        throw new Error(`Conectado a "${connectedDatabase}", que no es una base de tests. No se borra nada.`);
    }

    const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME AS name
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
    `;

    // Sin desactivar las claves foráneas, MySQL no deja vaciar una tabla a la que apuntan otras.
    // DELETE y no TRUNCATE: TRUNCATE recrea la tabla entera y, con 16 tablas antes de cada test,
    // cada test tardaba más de un segundo. Con DELETE los ids no vuelven a 1: los tests no deben depender de ellos.
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`DELETE FROM \`${table.name}\``);
    }
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
};

beforeEach(async () => {
    await cleanDatabase();
});

afterAll(async () => {
    await prisma.$disconnect();
});
