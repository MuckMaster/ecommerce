import * as cartService from "./cart.service.js";

const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCart(req.userId, req.sessionId);
        res.json(cart);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const addItem = async (req, res) => {
    try {
        const { productId, variantId, qty } = req.body;

        if(!productId || !qty || qty < 1) {
            return res.status(400).json({ error: "Missing required fields: productId, qty" });
        }

        const cart = await cartService.addItem(req.userId, req.sessionId, {
            productId,
            variantId,
            qty,
        });
        res.json(cart);
    } catch (e) {
        if (e.code === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({ error: "Product not found" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateItem = async (req, res) => {
    try {
        const { qty } = req.body;

        if (qty === undefined) {
            return res.status(400).json({ error: "Missing required field: qty" });
        }

        const cart = await cartService.updateItem(
            req.userId,
            req.sessionId,
            req.params.itemId,
            qty
        );
        res.json(cart);
    } catch (e) {
        if (e.code === "ITEM_NOT_FOUND") {
            return res.status(404).json({ error: "Item not found" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const removeItem = async (req, res) => {
    try {
        const cart = await cartService.removeItem(
            req.userId,
            req.sessionId,
            req.params.itemId
        );
        res.json(cart);
    } catch (e) {
        if (e.code === "ITEM_NOT_FOUND") {
            return res.status(404).json({ error: "Item not found" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCart(req.userId, req.sessionId);
        res.json(cart);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { getCart, addItem, updateItem, removeItem, clearCart };