import { Router } from "express";
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
  getStats,
} from "./admin-orders.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { requireRole } from "../../../middlewares/role.middleware.js";

const adminOrdersRoutes = Router();

// Todas las rutas requieren autenticación + rol ADMIN
// Aplicamos los middlewares globalmente con router.use() para no repetirlos
adminOrdersRoutes.use(authMiddleware, requireRole("ADMIN"));

// IMPORTANTE: /stats antes de /:id para que no se interprete como un id
adminOrdersRoutes.get("/stats", getStats);
adminOrdersRoutes.get("/", listOrders);
adminOrdersRoutes.get("/:id", getOrderById);
adminOrdersRoutes.put("/:id/status", updateOrderStatus);

export { adminOrdersRoutes };