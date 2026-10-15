// Configuración de seguridad de la API.
// Es el único sitio que lee JWT_SECRET, CORS_ORIGINS y TRUST_PROXY: el resto del código los importa de aquí.

// Una clave corta se puede adivinar probando combinaciones; 32 caracteres aleatorios ya no.
const MIN_JWT_SECRET_LENGTH = 32;

// Comando para generar una clave buena; se muestra en los mensajes de error.
const GENERATE_SECRET_COMMAND = `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`;

// Comprueba que la clave para firmar los JWT existe y es lo bastante larga, y la devuelve.
// Si no, la API no arranca a propósito: antes había una clave de serie escrita en el código,
// y cualquiera que la leyera en el repo podía fabricarse un token de ADMIN válido.
const requireJwtSecret = (value) => {
    if (!value || value.trim() === "") {
        throw new Error("Falta JWT_SECRET. Añádela al .env de la API (ver .env.example): sin ella la API no arranca.");
    }
    if (value.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(
            `JWT_SECRET es demasiado corta (${value.length} caracteres, mínimo ${MIN_JWT_SECRET_LENGTH}). ` +
            `Genera una con: ${GENERATE_SECRET_COMMAND}`
        );
    }
    return value;
};

// Se comprueba al importar el módulo, es decir, al arrancar la API: mejor fallar
// al principio con un mensaje claro que funcionar con una clave insegura.
export const JWT_SECRET = requireJwtSecret(process.env.JWT_SECRET);

// Convierte CORS_ORIGINS ("https://a.com, https://b.com") en una lista de orígenes.
// Vacía o sin definir devuelve una lista vacía, que significa "sin CORS": es lo normal,
// porque el frontend y la API van en el mismo dominio y el navegador no necesita permiso.
// Cada origen se valida porque un error de formato (una "/" al final, una ruta) no avisa:
// el navegador manda el origen exacto, no coincide con la lista y CORS falla sin explicación.
const parseCorsOrigins = (value) => {
    const origins = [];
    if (!value) {
        return origins;
    }

    for (const part of value.split(",")) {
        const origin = part.trim();
        if (origin === "") {
            continue;
        }

        // new URL() falla si no es una URL, y .origin se queda solo con protocolo, dominio y puerto.
        // Si al quitarle lo demás ya no es igual, es que traía algo de más.
        let parsedOrigin;
        try {
            parsedOrigin = new URL(origin).origin;
        } catch {
            parsedOrigin = null;
        }
        if (parsedOrigin !== origin) {
            throw new Error(
                `CORS_ORIGINS tiene un origen mal escrito: "${origin}". ` +
                `Formato: protocolo://dominio[:puerto], sin "/" al final ni ruta (ejemplo: https://tienda.com).`
            );
        }

        origins.push(origin);
    }
    return origins;
};

// También se comprueba al arrancar: un origen mal escrito para la API con un mensaje claro.
export const CORS_ORIGINS = parseCorsOrigins(process.env.CORS_ORIGINS);

// Convierte TRUST_PROXY en el valor de app.set("trust proxy"): cuántos proxies (Nginx, Caddy...)
// hay delante de la API. Vacía devuelve false: Express usa la IP de la conexión y no mira X-Forwarded-For.
// Por defecto desactivado a propósito: sin proxy, X-Forwarded-For lo escribe el cliente, y quien
// se la inventara en cada petición tendría una IP distinta y se saltaría el límite de intentos.
// Con proxy hay que activarlo (normalmente 1), o todos los clientes parecen la IP del proxy
// y el límite bloquearía a toda la tienda a la vez.
const parseTrustProxy = (value) => {
    if (!value || value.trim() === "") {
        return false;
    }

    const proxies = Number(value.trim());
    if (!Number.isInteger(proxies) || proxies < 0) {
        throw new Error(`TRUST_PROXY tiene que ser el número de proxies delante de la API (normalmente 1), no "${value}".`);
    }
    return proxies;
};

export const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);

export { requireJwtSecret, parseCorsOrigins, parseTrustProxy };
