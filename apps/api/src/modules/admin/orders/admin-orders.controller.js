import * as adminOrdersService from "./admin-orders.service.js";

// Listar pedidos con filtros y paginación
const listOrders = async (req, res) => {
  try {
    // Los filtros vienen como query params: ?status=PAID&page=1&limit=20
    const result = await adminOrdersService.listOrders(req.query);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Detalle de pedido
const getOrderById = async (req, res) => {
  try {
    const order = await adminOrdersService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cambiar estado
const updateOrderStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;

    // Validamos que el estado sea uno de los permitidos
    const validStatuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED", "REFUNDED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // req.userId viene del authMiddleware
    const order = await adminOrdersService.updateOrderStatus(
      req.params.id,
      status,
      comment,
      req.userId
    );

    res.json(order);
  } catch (e) {
    if (e.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "Order not found" });
    }
    if (e.code === "SAME_STATUS") {
      return res.status(400).json({ error: "Order already in this status" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Estadísticas del dashboard
const getStats = async (req, res) => {
  try {
    const stats = await adminOrdersService.getStats();
    res.json(stats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { listOrders, getOrderById, updateOrderStatus, getStats };