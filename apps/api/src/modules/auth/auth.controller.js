import * as authService from "./auth.service.js";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "../../config/security.js";

// Guarda el refresh token en una cookie httpOnly en vez de devolverlo en el JSON:
// así el frontend no lo tiene que guardar en localStorage, donde cualquier script podría leerlo.
const setRefreshCookie = (res, refreshToken) => {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
};

// Borra la cookie del refresh token. El navegador solo la borra si path, sameSite, etc.
// coinciden con los de cuando se creó; maxAge no hace falta (Express 5 lo ignora al borrar).
const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
        secure: REFRESH_COOKIE_OPTIONS.secure,
        sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
        path: REFRESH_COOKIE_OPTIONS.path,
    });
};

const register = async (req, res) => {

    try{
        const { name, email, password } = req.body;
        const sessionId = req.headers["x-session-id"] || null;

        if (!name || !email || !password){
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        const result = await authService.register({ name, email, password, sessionId });
        setRefreshCookie(res, result.refreshToken);
        res.status(201).json({ user: result.user, accessToken: result.accessToken });
    } catch (e) {
        if (e.code === "EMAIL_TAKEN") {
            return res.status(409).json({ error: "Email already in use" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await authService.login({ email, password });
        setRefreshCookie(res, result.refreshToken);
        res.json({ user: result.user, accessToken: result.accessToken });
    } catch (e) {
        if (e.code === "INVALID_CREDENTIALS") {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const refresh = async (req, res) => {

    try{
        const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

        const result = await authService.refresh(refreshToken);
        // La llave ha rotado: la cookie nueva sustituye a la vieja en el navegador
        setRefreshCookie(res, result.refreshToken);
        res.json({ accessToken: result.accessToken });
    } catch (e) {
        // En el 401 NO se borra la cookie a propósito: si dos refresh van a la vez, el perdedor
        // podría llegar después que el ganador y su "borrar cookie" pisaría la llave nueva y válida.
        if (e.code === "INVALID_REFRESH_TOKEN" || e.code === "NO_REFRESH_TOKEN") {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const logout = async (req, res) => {

    // Se borra la cookie lo primero, antes de tocar la base de datos: así va en la respuesta
    // pase lo que pase, también en el 500 si el service falla. No vale un finally, porque
    // se ejecutaría después de res.json() y las cabeceras ya estarían enviadas.
    clearRefreshCookie(res);

    try {
        // Sin cookie, refreshToken es undefined y authService.logout no hace nada: responde 200 igual
        const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
        await authService.logout(refreshToken);
        res.json({ ok: true, message: "Logged out"});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error"});
    }

};

const me = async (req, res) => {

    try {
        const user = await authService.getUserById(req.userId);
        if(!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

export { register, login, refresh, logout, me };