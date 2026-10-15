import { rateLimit, MemoryStore } from "express-rate-limit";

// Límites de intentos por IP para las rutas que un script podría machacar:
// el login (fuerza bruta de contraseñas) y el registro y el contacto (spam en la base de datos).
// Al pasarse, la API responde 429 sin llegar al controlador.

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// Cada límite guarda su contador en un almacén en memoria propio. Se crean aquí a mano
// (y no dejando que rateLimit cree el suyo) para poder vaciarlos desde los tests con resetRateLimits().
// En memoria vale con una sola instancia de la API; con varias, cada una contaría por su lado.
const loginStore = new MemoryStore();
const registerStore = new MemoryStore();
const contactStore = new MemoryStore();

// Login: 10 fallos cada 15 minutos. Solo cuenta el 401 (email o contraseña incorrectos),
// que es lo que genera la fuerza bruta: entrar bien, olvidar un campo (400) o un error nuestro (500)
// no gastan intentos. skipSuccessfulRequests + requestWasSuccessful hacen eso: todo lo que no sea 401
// se trata como "éxito" y se descuenta al terminar la respuesta.
const loginLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    store: loginStore,
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode !== 401,
    message: { error: "Too many failed login attempts, please try again later" },
});

// Registro: 5 cada hora, contando todas las peticiones, porque cada una puede crear una cuenta.
const registerLimiter = rateLimit({
    windowMs: ONE_HOUR,
    limit: 5,
    store: registerStore,
    message: { error: "Too many registration attempts, please try again later" },
});

// Contacto: 5 cada hora, contando todas, porque cada mensaje se guarda y envía un correo.
const contactLimiter = rateLimit({
    windowMs: ONE_HOUR,
    limit: 5,
    store: contactStore,
    message: { error: "Too many messages, please try again later" },
});

// Pone a cero todos los contadores. Solo la usan los tests (setup.js, antes de cada test),
// para que un test no herede los intentos que gastó el anterior.
const resetRateLimits = async () => {
    await loginStore.resetAll();
    await registerStore.resetAll();
    await contactStore.resetAll();
};

export { loginLimiter, registerLimiter, contactLimiter, resetRateLimits };
