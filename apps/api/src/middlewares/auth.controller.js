import * as authService from "./auth.service.js";

const register = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await authService.register({ name, email, password });
        res.status(201).json(result);
    } catch (e) {
        if (e.code === "EMAIL_TAKEN") {
            return res.status(409).json({ error: "Email already in use" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const login = async (req, res) => {

    try{
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ error: "Missing required fields"});
        }

        const result = await authService.login({ email, password });
        res.json(result);
    } catch (e) {
        if (e.code === "INVALID CREDENTIALS") {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error"});
    }

};

const logout = (req, res) => {
    res.json({ ok:true, message: "Logged out" });
};

const me = async (req, res) => {

    try {
        const user =await authService.getUserById(req.userId);
        if(!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

export { register, login, logout, me };