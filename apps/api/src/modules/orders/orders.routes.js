import { Router } from "express";
import {
    checkout,
    webhook,
    getOrders,
    getOrderById,
} from "./orders.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { optionalAuth } from "../../middlewares/optionalAuth.middleware.js";

const ordersRoutes = Router();


ordersRoutes.post("/checkout", optionalAuth, checkout);

ordersRoutes.get("/", authMiddleware, getOrders);
ordersRoutes.get("/:id", authMiddleware, getOrderById);

export { ordersRoutes };