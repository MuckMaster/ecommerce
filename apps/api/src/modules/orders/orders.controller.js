import { orders_status } from "@prisma/client";
import * as ordersService from "./orders.service.js";

const checkout = async (req, res) => {
    try {
        const {
            email,
            shipping_name,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_postcode,
            shipping_country,
            shipping_phone,
            notes,
            successUrl,
            cancelUrl
        } = req.body;

        if (!email || !shipping_name || !shipping_address_line1 || !shipping_city || !shipping_postcode){
            return res.status(400).json({ error: "Missing required shipping fields" });
        }

        if (!successUrl || !cancelUrl) {
            return res.status(400).json({ error: "Missing required fields: succesUrl, cancelUrl" })
        }

        const result = await ordersService.checkout(req.userId, req.sessionId, {
            email,
            shipping_name,
            shipping_phone,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_postcode,
            shipping_country,
            notes,
            successUrl,
            cancelUrl,
        });

        res.json(result);
    } catch (e) {
        if (e.code === "CART_EMPTY") {
            return res.status(400).json({ error: "Cart is empty" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    } 
};

const webhook = async (req, res) => {
    try {
        const signature = req.headers["stripe-signature"];

        if (!signature) {
            return res.status(400).json({ error: "Missing stripe signature" });
        }

        const result = await ordersService.handleWebhook(req.body, signature);
        res.json(result);
    } catch (e) {
        if (e.code === "INVALID_SIGNATURE") {
            return res.status(400).json({ error: "Invalid webhook signature" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await ordersService.getOrders(req.userId);
        res.json(orders);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getOrderById = async (req, res) => { 
    try {
        const order = await ordersService.getOrderById(req.userId, req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json(order);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { checkout, webhook, getOrders, getOrderById };