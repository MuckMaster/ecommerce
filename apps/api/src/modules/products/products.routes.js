import { Router } from "express";
import {
    getProducts,
    getProductById,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "./products.controller.js";
import {
    uploadProductImage,
    setPrimaryImage,
    deleteProductImage
} from "./images.controller.js";
import { productVariantsRoutes } from "../variants/variants.routes.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { uploadImage } from "../../lib/uploads.js";

const productsRoutes = Router();

//Rutas publicas
productsRoutes.get("/", getProducts);
productsRoutes.get("/search", searchProducts);
productsRoutes.get("/:id", getProductById);

//Rutas privadas
productsRoutes.post("/", authMiddleware, requireRole("ADMIN"), createProduct);
productsRoutes.put("/:id", authMiddleware, requireRole("ADMIN"), updateProduct);
productsRoutes.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteProduct);
//Imagenes
productsRoutes.post(
  "/:id/images",
  authMiddleware,
  requireRole("ADMIN"),
  uploadImage.single("image"),
  uploadProductImage
);
productsRoutes.put(
  "/:id/images/:imageId/primary",
  authMiddleware,
  requireRole("ADMIN"),
  setPrimaryImage
);
productsRoutes.delete(
  "/:id/images/:imageId",
  authMiddleware,
  requireRole("ADMIN"),
  deleteProductImage
);

// Variantes anidadas bajo productos
productsRoutes.use("/:id/variants", productVariantsRoutes);

export { productsRoutes };