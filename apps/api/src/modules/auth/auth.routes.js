import { Router } from "express";
import { register, login, refresh,logout, me } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimit.middleware.js";

const authRoutes = Router();

authRoutes.post("/register", registerLimiter, register);
authRoutes.post("/login", loginLimiter, login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);

authRoutes.get("/me", authMiddleware, me);

export { authRoutes };