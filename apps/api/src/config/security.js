// Configuración de seguridad de la API.
// Es el único sitio que lee JWT_SECRET: el resto del código lo importa de aquí.

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

export { requireJwtSecret };
