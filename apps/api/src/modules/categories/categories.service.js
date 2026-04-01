import { prisma } from "../../lib/prisma.js";

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
            product_categories: {
                where: { status: "PUBLISHED" },
                include: {
                    product_images: { where: { is_primary: true } },
                }
            }
        }
    });

    if(!category) return null;
    return formatCategory(category);
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