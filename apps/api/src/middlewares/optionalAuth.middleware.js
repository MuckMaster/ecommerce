import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

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