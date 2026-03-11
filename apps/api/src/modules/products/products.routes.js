import { Router } from "express";
import {
    getProducts,
    getProductsById,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "./products.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const productsRoutes = Router();

//Rutas publicas
productsRoutes.get("/", getProducts);
productsRoutes.get("/search", searchProducts);
productsRoutes.get("/:id", getProductById);

//Rutas privadas
productsRoutes.post("/", authMiddleware, requireRole("ADMIN"), createProduct);
productsRoutes.put("/:id", authMiddleware, requireRole("ADMIN"), updateProduct);
productsRoutes.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteProduct);

export { productsRoutes };