import { prisma } from "../../lib/prisma.js";

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
        ...v,
        id: String(v.id),
        product_id: String(v.product_id),
        price: v.price_cents ? centsToEuros(v.price_cents): null,
        price_cents: undefined,
    })),
    product_images: product.product_images?.map((img) => ({
        ...img,
        id: String(img.id),
        product_id: String(img.product_id),
        variant_id: img.variant_id ? String(img.variant_id): null,
    })),
    product_categories: product.product_categories?.map((pc) => ({
        category_id: String(pc.category_id),
        categories: pc.categories,
    })),

});

const getProducts = async ({ status, featured, category } = {}) => {

    const where = {};
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
        where: { id: BigInt(id) },
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

const createProduct = async (data) => {

    const { name, slug, short_description, description, price, material, is_featured, status } = data;

    const product = await prisma.products.create({
        data: {
        name,
        slug,
        short_description,
        description,
        price_cents: eurosToCents(price),
        material,
        is_featured: is_featured || false,
        status: status || "DRAFT",
    },
    });

    return formatProduct(product);

};

const updateProduct = async (id,data) => {
    
    const { name, slug, short_description, description, price, material, is_featured, status } = data;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.material = material;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (status !== undefined) updateData.status = status;

    const product = await prisma.products.update({
        where: { id: BigInt(id) },
        data: updateData,
        include: {
            product_images: true,
            product_variants: true,
            product_categories: { include: { categories: true } },
        },
    });

    return formatProduct(product);

};

const deleteProduct = async (id) => {
    await prisma.products.delete({
        where: { id: BigInt(id) },
    });
};

export { getProducts, getProductById, searchProducts, createProduct, updateProduct, deleteProduct };
