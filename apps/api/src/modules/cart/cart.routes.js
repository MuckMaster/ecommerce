import { Router } from "express";
import {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
} from "./cart.controller.js";
import { optionalAuth } from "../../middlewares/optionalAuth.middleware.js";

const cartRoutes = Router();

cartRoutes.get("/", optionalAuth, getCart);
cartRoutes.post("/items", optionalAuth, addItem);
cartRoutes.put("/items/:itemId", optionalAuth, updateItem);
cartRoutes.delete("/items/:itemId", optionalAuth, removeItem);
cartRoutes.delete("/", optionalAuth, clearCart);

export { cartRoutes };
