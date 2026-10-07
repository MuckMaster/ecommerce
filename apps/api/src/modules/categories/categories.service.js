import { prisma } from "../../lib/prisma.js";

const centsToEuros = (cents) => parseFloat((cents / 100).toFixed(2));

const formatCategory =(category) => ({
    ...category,
    id: String(category.id),
});

const getCategories = async () => {
    const categories = await prisma.categories.findMany({
        where: {is_active: true},
        orderBy: { sort_order: "asc" },
    });
    return categories.map(formatCategory);
};

const getCategoryBySlug = async (slug) => {
    const category = await prisma.categories.findUnique({
        where: { slug },
        include: {
            //status y deleted_at son del producto, no de la tabla pivote: filtramos a mano abajo
            product_categories: {
                include: {
                    products: {
                        include: {
                            product_images: { where: { is_primary: true } },
                        },
                    },
                },
            },
        },
    });

    if(!category) return null;

    const data = formatCategory(category);

    data.product_categories = category.product_categories
        .filter((pc) => pc.products && pc.products.status === "PUBLISHED" && pc.products.deleted_at === null)
        .map((pc) => ({
            product_id: String(pc.product_id),
            category_id: String(pc.category_id),
            products: {
                id: String(pc.products.id),
                name: pc.products.name,
                slug: pc.products.slug,
                short_description: pc.products.short_description,
                price: centsToEuros(pc.products.price_cents),
                status: pc.products.status,
                is_featured: pc.products.is_featured,
                created_at: pc.products.created_at,
                product_images: pc.products.product_images.map((img) => ({
                    id: String(img.id),
                    url: img.url,
                    alt_text: img.alt_text,
                    is_primary: img.is_primary,
                })),
            },
        }));

    return data;
};

const createCategory = async ({ name, slug, description, sort_order }) => {
    const category = await prisma.categories.create({
        data: {
            name,
            slug,
            description,
            sort_order: sort_order || 0,
        },
    });
    return formatCategory(category);
};

const updateCategory = async (id, data) => {
    const { name, slug, description, sort_order, is_active } = data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const category = await prisma.categories.update({
        where: { id: BigInt(id) },
        data: updateData,
    });

    return formatCategory(category);
};

const deleteCategory = async (id) => {
    await prisma.categories.delete({
        where: { id: BigInt(id) }, 
    });
};

export { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };