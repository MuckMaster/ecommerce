import { describe, it, expect } from "vitest";
import { getDatabaseName, isTestDatabaseUrl, buildTestDatabaseUrl } from "./helpers/test-database.js";

// Pruebas de las funciones que eligen la base de datos de los tests.
// Son las que protegen la base de desarrollo, así que conviene tenerlas cubiertas.
describe("helpers de la base de datos de tests", () => {
    const devUrl = "mysql://user:secret@mysql:3306/tienda";

    it("saca el nombre de la base de la URL", () => {
        expect(getDatabaseName(devUrl)).toBe("tienda");
    });

    it("solo acepta como base de tests las que terminan en _test", () => {
        expect(isTestDatabaseUrl(devUrl)).toBe(false);
        expect(isTestDatabaseUrl("mysql://user:secret@mysql:3306/tienda_test")).toBe(true);
        expect(isTestDatabaseUrl("mysql://user:secret@mysql:3306/tienda_test_old")).toBe(false);
    });

    it("convierte la URL de desarrollo en la de tests sin tocar servidor ni usuario", () => {
        const testUrl = buildTestDatabaseUrl(devUrl);

        expect(getDatabaseName(testUrl)).toBe("tienda_test");
        expect(testUrl.startsWith("mysql://user:secret@mysql:3306/")).toBe(true);
        expect(new URL(testUrl).searchParams.get("connection_limit")).toBe("1");
    });

    it("no añade _test dos veces si la URL ya es de tests", () => {
        const testUrl = buildTestDatabaseUrl("mysql://user:secret@mysql:3306/tienda_test");

        expect(getDatabaseName(testUrl)).toBe("tienda_test");
    });
});
