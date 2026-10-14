import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/security.js";

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try{
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        req.userRole = payload.role;
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

};

export { authMiddleware };