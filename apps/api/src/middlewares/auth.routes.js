import { Router } from "express";
import { register, login, logout, me } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", authMiddleware, me);

export { authRoutes };

