import { Router } from "express";
import {
    getCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
} from "./categories.controller.js"
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js"

const categoriesRoutes = Router();

categoriesRoutes.get("/", getCategories);
categoriesRoutes.get("/:slug", getCategoryBySlug);

categoriesRoutes.post("/", authMiddleware, requireRole("ADMIN"), createCategory);
categoriesRoutes.put("/;id", authMiddleware, requireRole("ADMIN"), updateCategory);
categoriesRoutes.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteCategory);

export { categoriesRoutes };