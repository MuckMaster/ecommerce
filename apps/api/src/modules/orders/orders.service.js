import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import crypto from "crypto";
import { ORDER_PREFIX } from "../../config/brand.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const centsToEuros = (cents) => parseFloat((cents / 100).toFixed(2));
const eurosToCents = (euros) => Math.round(parseFloat(euros) * 100);

const calculateShipping = (subtotalCents) => {
  const freeFrom = eurosToCents(process.env.SHIPPING_FREE_FROM || 50);
  const shippingPrice = parseInt(process.env.SHIPPING_PRICE || 499);
  if (subtotalCents >= freeFrom) return 0;
  return shippingPrice;
};

const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${ORDER_PREFIX}-${date}-${random}`;
};

const formatOrder = (order) => ({
  ...order,
  id: String(order.id),
  user_id: order.user_id ? String(order.user_id) : null,
  subtotal: centsToEuros(order.subtotal_cents),
  discount: centsToEuros(order.discount_cents),   // era shipping_cents, corregido
  shipping: centsToEuros(order.shipping_cents),    // faltaba shipping
  total: centsToEuros(order.total_cents),
  subtotal_cents: undefined,
  discount_cents: undefined,
  shipping_cents: undefined,
  total_cents: undefined,
  payments: undefined, //Laravel no devuelve payments en formatOrder; su id en BigInt rompe el JSON
  order_items: order.order_items?.map((item) => ({
    ...item,
    id: String(item.id),
    order_id: String(item.order_id),
    product_id: String(item.product_id),
    variant_id: item.variant_id ? String(item.variant_id) : null, // era vairant_id, corregido
    unit_price: centsToEuros(item.unit_price_cents),
    line_total: centsToEuros(item.line_total_cents),
    unit_price_cents: undefined,
    line_total_cents: undefined,
  })),
});

const checkout = async (userId, sessionId, {
  email,
  shipping_name,
  shipping_phone,
  shipping_address_line1,   // era shipping_adress_line1, corregido
  shipping_address_line2,
  shipping_city,
  shipping_postcode,
  shipping_country,
  notes,
  successUrl,
  cancelUrl,
}) => {
  const cart = await prisma.carts.findFirst({
    where: userId
      ? { user_id: BigInt(userId) }
      : { session_id: sessionId },
    include: {
      cart_items: {
        include: { products: true, product_variants: true },
      },
    },
  });

  if (!cart || cart.cart_items.length === 0) {
    const error = new Error("Cart is empty");
    error.code = "CART_EMPTY";
    throw error;
  }

  const subtotalCents = cart.cart_items.reduce(
    (sum, item) => sum + item.unit_price_cents * item.qty,
    0
  );

  const shippingCents = calculateShipping(subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  const order = await prisma.orders.create({
    data: {
      order_number: generateOrderNumber(),
      user_id: userId ? BigInt(userId) : null,
      email,
      status: "PENDING",
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_postcode,
      shipping_country: shipping_country || "ES",
      notes,
      order_items: {
        create: cart.cart_items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name_snapshot: item.products.name,
          variant_snapshot: item.product_variants?.color || null, // era product_variant, corregido
          unit_price_cents: item.unit_price_cents,
          qty: item.qty,
          line_total_cents: item.unit_price_cents * item.qty,
        })),
      },
    },
    include: { order_items: true },
  });

  // era liteItems, corregido a lineItems
  const lineItems = cart.cart_items.map((item) => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: item.products.name,
        description: item.product_variants?.color || undefined,
      },
      unit_amount: item.unit_price_cents,
    },
    quantity: item.qty,
  }));

  if (shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Gastos de envío" },
        unit_amount: shippingCents,
      },
      quantity: 1,
    });
  }

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      order_id: String(order.id),
    },
    customer_email: email,
  });

  await prisma.payments.create({
    data: {
      order_id: order.id,
      stripe_payment_intent_id: stripeSession.payment_intent || stripeSession.id,
      stripe_checkout_session_id: stripeSession.id,
      status: "REQUIRES_PAYMENT",
      amount_cents: totalCents,
    },
  });

  return {
    order: formatOrder(order),
    checkoutUrl: stripeSession.url,
  };
};

const handleWebhook = async (rawBody, signature) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    const error = new Error("Invalid webhook signature");
    error.code = "INVALID_SIGNATURE";
    throw error;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.order_id;

    await prisma.orders.update({
      where: { id: BigInt(orderId) },
      data: { status: "PAID" },
    });

    await prisma.payments.updateMany({
      where: { stripe_checkout_session_id: session.id },
      data: { status: "SUCCEEDED" },
    });

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderId) },
    });

    if (order.user_id) {
      const cart = await prisma.carts.findFirst({
        where: { user_id: order.user_id },
      });
      if (cart) {
        await prisma.cart_items.deleteMany({ where: { cart_id: cart.id } });
      }
    }
  }

  return { received: true };
};

const getOrders = async (userId) => {
  const orders = await prisma.orders.findMany({
    where: { user_id: BigInt(userId) },
    include: { order_items: true },
    orderBy: { created_at: "desc" },
  });
  return orders.map(formatOrder);
};

const getOrderById = async (userId, orderId) => {
  const order = await prisma.orders.findFirst({
    where: {
      id: BigInt(orderId),
      user_id: BigInt(userId),
    },
    include: { order_items: true, payments: true },
  });

  if (!order) return null;
  return formatOrder(order);
};

export { checkout, handleWebhook, getOrders, getOrderById };
