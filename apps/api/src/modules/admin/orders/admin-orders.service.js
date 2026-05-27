import { prisma } from "../../../lib/prisma.js";

const centsToEuros = (cents) => parseFloat((cents / 100).toFixed(2));

// Formatea un pedido para el admin — incluye datos de usuario y items
const formatOrder = (order) => ({
  id: String(order.id),
  order_number: order.order_number,
  user_id: order.user_id ? String(order.user_id) : null,
  email: order.email,
  status: order.status,
  subtotal: centsToEuros(order.subtotal_cents),
  discount: centsToEuros(order.discount_cents),
  shipping: centsToEuros(order.shipping_cents),
  total: centsToEuros(order.total_cents),
  currency: order.currency,
  shipping_name: order.shipping_name,
  shipping_phone: order.shipping_phone,
  shipping_address_line1: order.shipping_address_line1,
  shipping_address_line2: order.shipping_address_line2,
  shipping_city: order.shipping_city,
  shipping_postcode: order.shipping_postcode,
  shipping_country: order.shipping_country,
  notes: order.notes,
  created_at: order.created_at,
  updated_at: order.updated_at,
  user: order.users ? {
    id: String(order.users.id),
    name: order.users.name,
    email: order.users.email,
  } : null,
  items: order.order_items?.map((item) => ({
    id: String(item.id),
    product_id: String(item.product_id),
    variant_id: item.variant_id ? String(item.variant_id) : null,
    product_name: item.product_name_snapshot,
    variant: item.variant_snapshot,
    qty: item.qty,
    unit_price: centsToEuros(item.unit_price_cents),
    line_total: centsToEuros(item.line_total_cents),
  })),
  history: order.order_status_history?.map((h) => ({
    id: String(h.id),
    from_status: h.from_status,
    to_status: h.to_status,
    comment: h.comment,
    changed_by_user_id: h.changed_by_user_id ? String(h.changed_by_user_id) : null,
    changed_by: h.users ? {
      id: String(h.users.id),
      name: h.users.name,
    } : null,
    created_at: h.created_at,
  })),
});

// Listar pedidos con filtros
// Soporta filtros opcionales: status, from, to, q (búsqueda), page, limit
const listOrders = async ({ status, from, to, q, page = 1, limit = 20 } = {}) => {
  const where = {};

  // Filtro por estado
  if (status) where.status = status;

  // Filtro por rango de fechas
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from); // gte = greater than or equal
    if (to) where.created_at.lte = new Date(to);     // lte = less than or equal
  }

  // Búsqueda por número de pedido o email
  if (q) {
    where.OR = [
      { order_number: { contains: q } },
      { email: { contains: q } },
      { shipping_name: { contains: q } },
    ];
  }

  // Paginación
  const skip = (page - 1) * limit;
  const take = parseInt(limit);

  // Hacemos dos consultas en paralelo: pedidos y total
  // Promise.all las ejecuta a la vez para ahorrar tiempo
  const [orders, total] = await Promise.all([
    prisma.orders.findMany({
      where,
      include: {
        users: true,
        order_items: true,
      },
      orderBy: { created_at: "desc" }, // Más recientes primero
      skip,
      take,
    }),
    prisma.orders.count({ where }), // Total de resultados para la paginación
  ]);

  return {
    data: orders.map(formatOrder),
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      pages: Math.ceil(total / take), // Total de páginas
    },
  };
};

// Detalle completo de un pedido incluyendo historial
const getOrderById = async (orderId) => {
  const order = await prisma.orders.findUnique({
    where: { id: BigInt(orderId) },
    include: {
      users: true,
      order_items: true,
      order_status_history: {
        include: { users: true }, // Usuario que hizo el cambio
        orderBy: { created_at: "asc" },
      },
      payments: true,
    },
  });

  if (!order) return null;
  return formatOrder(order);
};

// Cambiar el estado de un pedido
// adminUserId es quién hace el cambio — se guarda en el historial
const updateOrderStatus = async (orderId, newStatus, comment, adminUserId) => {
  // Obtenemos el estado actual para guardarlo como from_status en el historial
  const currentOrder = await prisma.orders.findUnique({
    where: { id: BigInt(orderId) },
  });

  if (!currentOrder) {
    const error = new Error("Order not found");
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  // Si el estado es el mismo, no hacemos nada
  if (currentOrder.status === newStatus) {
    const error = new Error("Order already in this status");
    error.code = "SAME_STATUS";
    throw error;
  }

  // Usamos una transacción para que ambas operaciones se hagan juntas
  // Si una falla, la otra se revierte automáticamente
  const order = await prisma.$transaction(async (tx) => {
    // Actualizamos el estado del pedido
    const updated = await tx.orders.update({
      where: { id: BigInt(orderId) },
      data: { status: newStatus },
      include: {
        users: true,
        order_items: true,
        order_status_history: {
          include: { users: true },
          orderBy: { created_at: "asc" },
        },
      },
    });

    // Guardamos el cambio en el historial
    await tx.order_status_history.create({
      data: {
        order_id: BigInt(orderId),
        from_status: currentOrder.status,
        to_status: newStatus,
        changed_by_user_id: BigInt(adminUserId),
        comment: comment || null,
      },
    });

    return updated;
  });

  // Volvemos a buscar con el historial actualizado para devolverlo
  return getOrderById(orderId);
};

// Estadísticas básicas para el dashboard
const getStats = async () => {
  // Calculamos fechas para los rangos
  const now = new Date();

  // Inicio del día actual (00:00:00)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Inicio del mes actual (día 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 30 días atrás
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Ejecutamos todas las consultas en paralelo para máxima eficiencia
  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    shippedOrders,
    ordersToday,
    ordersThisMonth,
    revenueAll,
    revenueThisMonth,
    revenueLast30Days,
  ] = await Promise.all([
    // Total de pedidos (todos los estados)
    prisma.orders.count(),

    // Pedidos por estado
    prisma.orders.count({ where: { status: "PENDING" } }),
    prisma.orders.count({ where: { status: "PAID" } }),
    prisma.orders.count({ where: { status: "SHIPPED" } }),

    // Pedidos por rango temporal
    prisma.orders.count({ where: { created_at: { gte: today } } }),
    prisma.orders.count({ where: { created_at: { gte: thisMonth } } }),

    // Ingresos: sumamos total_cents de pedidos pagados
    // _sum es una función de agregación de Prisma
    prisma.orders.aggregate({
      where: { status: { in: ["PAID", "SHIPPED"] } }, // Solo pedidos que generan ingresos reales
      _sum: { total_cents: true },
    }),
    prisma.orders.aggregate({
      where: {
        status: { in: ["PAID", "SHIPPED"] },
        created_at: { gte: thisMonth },
      },
      _sum: { total_cents: true },
    }),
    prisma.orders.aggregate({
      where: {
        status: { in: ["PAID", "SHIPPED"] },
        created_at: { gte: thirtyDaysAgo },
      },
      _sum: { total_cents: true },
    }),
  ]);

  return {
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      paid: paidOrders,
      shipped: shippedOrders,
      today: ordersToday,
      this_month: ordersThisMonth,
    },
    revenue: {
      // _sum.total_cents puede ser null si no hay pedidos — usamos 0 como fallback
      total: centsToEuros(revenueAll._sum.total_cents || 0),
      this_month: centsToEuros(revenueThisMonth._sum.total_cents || 0),
      last_30_days: centsToEuros(revenueLast30Days._sum.total_cents || 0),
    },
  };
};

export { listOrders, getOrderById, updateOrderStatus, getStats };