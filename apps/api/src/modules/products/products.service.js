import { prisma } from "../../lib/prisma.js";
import { resolveColorCss } from "../variants/variants.service.js";

//convierte euros a centimos para guardar en BD al momento de introducir un precio
// Ej. 29.99 -> 2999
const eurosToCents = (euros) => Math.round(parseFloat(euros) * 100);

//convierte centimos a euros para devolverle al cliente
//Ej. 2999 -> 29.99
const centsToEuros = (cents) => parseFloat((cents / 100).toFixed(2));


const formatProduct = (product) => ({

    ...product,
    id: String(product.id),
    price: centsToEuros(product.price_cents), //devuelve precio en euros
    price_cents: undefined, //oculta centimos
    product_variants: product.product_variants?.map((v) => ({
        id: String(v.id),
        product_id: String(v.product_id),
        sku: v.sku,
        name: v.color, //el frontend espera "name" para el color, no "color"
        css: resolveColorCss(v.color, v.color_css), //mismo mapa de colores que variants.service.js
        price: v.price_cents ? centsToEuros(v.price_cents): null,
        stock_qty: v.stock_qty,
        is_active: v.is_active,
    })),
    product_images: product.product_images?.map((img) => ({
        ...img,
        id: String(img.id),
        product_id: String(img.product_id),
        variant_id: img.variant_id ? String(img.variant_id): null,
    })),
    product_categories: product.product_categories?.map((pc) => ({
        category_id: String(pc.category_id),
        //categories trae el id en BigInt: lo serializamos a mano, el id en crudo rompe JSON.stringify
        categories: pc.categories ? {
            id: String(pc.categories.id),
            name: pc.categories.name,
            slug: pc.categories.slug,
            sort_order: pc.categories.sort_order,
            is_active: pc.categories.is_active,
        } : null,
    })),

});

const getProducts = async ({ status, featured, category } = {}) => {

    const where = {
        deleted_at: null,
    };
    where.status = status ||"PUBLISHED";

    if (featured !== undefined) {
        where.is_featured = featured === "true";
    }

    if(category) {
        where.product_categories = {
            some: { categories: { slug: category } },
        };
    }

    const products = await prisma.products.findMany({
        where,
        include: {
            product_images: { orderBy: { sort_order: "asc" } },
            product_variants: { where: { is_active: true } },
            product_categories: { include: { categories: true } },
        },
        orderBy: { created_at: "desc" },
    });

    return products.map(formatProduct);

};

const getProductById = async (id) => {

    const product = await prisma.products.findUnique({
        where: { 
            id: BigInt(id),
            deleted_at: null
        },
        include: {
            product_images: { orderBy: { sort_order: "asc" } },
            product_variants: { where: { is_active: true } },
            product_categories: { include: { categories: true } },
        },
    });

    if(!product) return null;
    return formatProduct(product);
};

const searchProducts = async (q) => {

    if (!q) return [];

    const products = await prisma.products.findMany({
        where: {
            status: "PUBLISHED",
            deleted_at: null,
            OR: [
                { name: { contains: q } },
                { short_description: {contains: q } },
            ],
        },
        include: {
            product_images: { where: { is_primary: true } },
            product_variants: { where: { is_active: true } },
            product_categories: { include: { categories: true } },
        },
        orderBy: { created_at: "desc" },
    });

    return products.map(formatProduct);

};

//reemplaza las categorias de un producto por las nuevas (equivalente a sync() de Laravel)
//si category_ids llega vacio, se quitan todas; si no llega, no se llama a esta funcion
const syncCategories = async (tx, productId, categoryIds) => {
    await tx.product_categories.deleteMany({ where: { product_id: productId } });
    if (categoryIds.length > 0) {
        await tx.product_categories.createMany({
            data: categoryIds.map((category_id) => ({
                product_id: productId,
                category_id: BigInt(category_id),
            })),
        });
    }
};

const createProduct = async (data) => {

    const { name, slug, short_description, description, price, material, care, is_featured, status, category_ids } = data;

    const product = await prisma.$transaction(async (tx) => {
        const created = await tx.products.create({
            data: {
                name,
                slug,
                short_description,
                description,
                price_cents: eurosToCents(price),
                material,
                care,
                is_featured: is_featured || false,
                status: status || "DRAFT",
            },
        });

        if (category_ids !== undefined) {
            await syncCategories(tx, created.id, category_ids);
        }

        //recargamos con las relaciones para devolver el mismo formato que updateProduct
        return tx.products.findUnique({
            where: { id: created.id },
            include: {
                product_images: true,
                product_variants: true,
                product_categories: { include: { categories: true } },
            },
        });
    });

    return formatProduct(product);

};

const updateProduct = async (id,data) => {

    const { name, slug, short_description, description, price, material, care, is_featured, status, category_ids } = data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price_cents = eurosToCents(price);
    if (material !== undefined) updateData.material = material;
    if (care !== undefined) updateData.care = care;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (status !== undefined) updateData.status = status;

    const product = await prisma.$transaction(async (tx) => {
        const updated = await tx.products.update({
            where: { id: BigInt(id) },
            data: updateData,
        });

        if (category_ids !== undefined) {
            await syncCategories(tx, updated.id, category_ids);
        }

        return tx.products.findUnique({
            where: { id: updated.id },
            include: {
                product_images: true,
                product_variants: true,
                product_categories: { include: { categories: true } },
            },
        });
    });

    return formatProduct(product);

};

const deleteProduct = async (id) => {
    await prisma.products.update({
        where: { id: BigInt(id) },
        data: { deleted_at: new Date() },
    });
};

export { getProducts, getProductById, searchProducts, createProduct, updateProduct, deleteProduct };
