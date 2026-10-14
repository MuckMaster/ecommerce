import { defineConfig } from "vitest/config";

// Configuración de los tests de la API (npm test).
export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.js"],
        // Se ejecuta antes de cada archivo de test: apunta Prisma a la base _test y la vacía entre tests
        setupFiles: ["./tests/setup.js"],
        // Todos los archivos comparten la misma base de datos de tests: si corrieran a la vez,
        // uno podría vaciar las tablas mientras otro las está usando. Por eso van en serie.
        fileParallelism: false,
    },
});
