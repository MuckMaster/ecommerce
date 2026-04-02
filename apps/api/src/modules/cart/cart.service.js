import { prisma } from "../../lib/prisma.js";
import crypto from "crypto";

const centsToEuros = (cents) => parseFloat((cents / 100).toFixed(2));

const formatItem = (item) => ({
    id: String(item.id),
    cart_id: String(item.cart_id),
    product_id: String(item.product_id),
    variant_id: item.variant_id ? String(item.variant_id) : null,
    qty: item.qty,
    unit_price: centsToEuros(item.unit_price_cents),
    line_total: centsToEuros(item.unit_price_cents * item.qty),
    product: item.products ? {
        id: String(item.products.id),
        name: item.products.name,
        slug: item.products.slug,
        image: item.products.product_images?.[0]?.url || null,
    } :null,
    variant: item.product_variants ? {
        id: String(item.product_variants.id),
        color: item.product_variants.color,
        sku: item.product_variants.sku,
    }: null,
});

const formatCart = (cart) => {
    const items = cart.cart_items.map(formatItem);

    const total = items.reduce((sum, item) => sum + item.line_total, 0);

    return {
        id:stringify(cart.id),
        session_id: cart.session_id,
        user_id: cart.user_id ? String(cart.user_id) : null,
        items,
        total: parseFloat(total.toFixed(2)),
        currency: cart.currency,
    };
};

const cartInclude = {
    cart_items: {
        include: {
            products: {
                include: {
                    product_images: { where: { is_primary: true } }
                },
            },
            product_variants: true,
        },
    },
};

const getOrCreateCart = async (userId, sessionId) => {
    if (userId) {
        let cart = await prisma.carts.findFirst({
            where: { user_id: BigInt(userId) },
            include: cartInclude,
        });

        if (!cart) {
            cart = await prisma.carts.create({
                data: { user_id: BigInt(userId) },
                include: cartInclude,
            });
        }
        return cart;
    }

    if (sessionId) {
        let cart = await prisma.carts.findFirst({
            where: { session_id: sessionId },
            include: cartInclude,
        });

        if (!cart) {
            cart = await prisma.carts.create({
                data: { session_id: sessionId },
                include: cartInclude,
            });
        }
        return cart;
    }

    const newSessionId = crypto.randomUUID();
    const cart = await prisma.carts.create({
        data: { session_id: newSessionId },
        include: cartInclude,
    });
    return cart;
};

const getCart = async (userId, sessionId) => {
    const cart = await getOrCreateCart(userId, sessionId);
    return formatCart(cart);
};

const addItem = async (userId, sessionId, { productId, variantId, qty }) => {
    const cart = await getOrCreateCart(userId, sessionId);

    const product = await prisma.products.findUnique({
        where: { id: BigInt(productId) },
    });

    if (!product) {
        const error = new Error ("Product not found");
        error.code = "PRODUCT_NOT_FOUND";
        throw error;
    }

    let priceCents = product.price_cents;

    if (variantId) {
        const variant = await prisma.product_variants.findUnique({
            where: { id: BigInt(variantId) },
        });
        if (variant?.price_cents) priceCents = variant.price_cents;
    }

    const existing = await prisma.cart_items.findFirst({
        where: {
            cart_id: cart.id,
            product_id: BigInt(productId),
            variant_id: variantId ? BigInt(variantId) : null,
        },
    });

    if (existing) {
        await prisma.cart_items.update({
            where: { id: existing.id },
            data: { qty: existing.qty + qty },
        });
    } else {
        await prisma.cart_items.create({
            data: {
                cart_id: cart.id,
                product_id: BigInt(productId),
                variant_id: variantId ? BigInt(variantId) : null,
                qty,
                unit_price_cents: priceCents,
            },
        });
    }
    return getCart(userId, sessionId);
};

const updateItem = async (userId, sessionId, itemId, qty) => {
    const cart = await getOrCreateCart(userId, sessionId);

    const item = await prisma.cart_items.findFirst({
        where: { id: BigInt(itemId), cart_id: cart.id },
    });

    if(!item) {
        const error = new Error("Item not found");
        error.code = "ITEM_NOT_FOUND";
        throw error;
    }

    if(qty <= 0) {
        await prisma.cart_items.delete({ where: { id: BigInt(itemId) } });
    } else {
        await prisma.cart_items.update({
            where: { id: BigInt(itemId) },
            data: { qty },
        });
    }

    return getCart(userId, sessionId);
};

const removeItem = async (userId, sessionId, itemId) => {
    const cart = await getOrCreateCart(userId, sessionId);

    const item = await prisma.cart_items.findFirst({
        where: { id: BigInt(itemId), cart_id: cart.id },
    });

    if (!item) {
        const error = new Error("Item not found");
        error.code = "ITEM_NOT_FOUND";
        throw error;
    }

    await prisma.cart_items.delete({ where: {id: BigInt(itemId) } });
    return getCart(userId, sessionId);
};

const clearCart = async (userId, sessionId) => {
    const cart = await getOrCreateCart(userId, sessionId);

    await prisma.cart_items.deleteMany({
        where: { cart_id: cart.id },
    });

    return getCart(userId, sessionId);
};


// Fusiona el carrito anónimo con el carrito del usuario recién registrado
// Se llama desde auth.service.js después de crear el usuario
const mergeCart = async (userId, sessionId) => {
    if (!sessionId) return;
    
    const anonCart = await prisma.carts.findFirst({
        where: { session_id: sessionId },
        include: { cart_items: true },
    });

    if (!anonCart || anonCart.cart_items.length === 0) return;

    let userCart = await prisma.carts.findFirst({
        where: { user_id: BigInt(userId) },
    });

    if(!userCart) {
        userCart = await prisma.carts.create({
            data: { user_id: BigInt(userId) },
        });
    }
    for (const item of anonCart.cart_items) {
        const existing = await prisma.cart_items.findFirst({
            where: {
                cart_id: userCart.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
            },
        });

        if (existing) {
            await prisma.cart_items.update({
                where: { id: existing.id },
                data: { qty: existing.qty + item.qty },
            });
        } else {
            await prisma.cart_items.update({
                where: { id: item.id },
                data: { cart_id: userCart.id },
            });
        }
    }

    await prisma.cart.delete({ where: { id: anonCart.id } });
};

export { getCart, addItem, updateItem, removeItem, clearCart, mergeCart };