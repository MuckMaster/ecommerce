import { Router } from "express";
import {
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "./variants.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

// Router para rutas anidadas bajo /products/:id/variants
// mergeParams: true permite acceder a req.params.id (el del producto) desde aquí
const productVariantsRoutes = Router({ mergeParams: true });

productVariantsRoutes.get("/", getVariantsByProduct);
productVariantsRoutes.post("/", authMiddleware, requireRole("ADMIN"), createVariant);

// Router separado para acciones directas sobre variantes (sin el producto en la URL)
const variantsRoutes = Router();

variantsRoutes.put("/:variantId", authMiddleware, requireRole("ADMIN"), updateVariant);
variantsRoutes.delete("/:variantId", authMiddleware, requireRole("ADMIN"), deleteVariant);

export { productVariantsRoutes, variantsRoutes };