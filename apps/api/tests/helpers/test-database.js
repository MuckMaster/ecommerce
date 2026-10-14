// Funciones para decidir a qué base de datos se conectan los tests.
// Están separadas de setup.js para poder probarlas solas: son las que impiden
// que un test vacíe por error la base de desarrollo.

// Devuelve el nombre de la base de una URL de MySQL ("mysql://u:p@host:3306/tienda" -> "tienda").
const getDatabaseName = (databaseUrl) => {
    const url = new URL(databaseUrl);
    // pathname es "/tienda": se quita la barra del principio
    return url.pathname.slice(1);
};

// Dice si una URL apunta a una base de tests, es decir, cuyo nombre termina en "_test".
const isTestDatabaseUrl = (databaseUrl) => {
    return getDatabaseName(databaseUrl).endsWith("_test");
};

// Recibe la DATABASE_URL normal y devuelve la de la base de tests: el mismo servidor,
// usuario y contraseña, pero con "_test" al final del nombre de la base.
// Así no hace falta otra variable de entorno con la contraseña repetida.
const buildTestDatabaseUrl = (databaseUrl) => {
    const url = new URL(databaseUrl);

    let databaseName = getDatabaseName(databaseUrl);
    if (!databaseName.endsWith("_test")) {
        databaseName = databaseName + "_test";
    }
    url.pathname = "/" + databaseName;

    // Una sola conexión: "SET FOREIGN_KEY_CHECKS = 0" solo afecta a la conexión que lo ejecuta,
    // y con varias, Prisma podría hacer el borrado por otra y fallar por las claves foráneas.
    url.searchParams.set("connection_limit", "1");

    return url.toString();
};

export { getDatabaseName, isTestDatabaseUrl, buildTestDatabaseUrl };
