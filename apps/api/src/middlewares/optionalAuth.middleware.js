import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/security.js";

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.userId = payload.userId;
            req.userRole = payload.role;
        } catch (e) {

        }
    }

    req.sessionId= req.headers["x-session-id"] || null;

    next();
};

export { optionalAuth };