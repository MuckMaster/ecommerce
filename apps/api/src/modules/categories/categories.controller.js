import * as categoriesService from "./categories.service.js";

const getCategories = async (req, res) => {
    try {
        const categories = await categoriesService.getCategories();
        res.json(categories);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getCategoryBySlug = async (req, res) => {
    try {
        const category = await categoriesService.getCategoryBySlug(req.params.slug);
        if (!category) return res.status(404).json({ error: "Category not found" });
        res.json(category);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, slug } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: "Missing required fields: name, slug" });
        }

        const category = await categoriesService.createCategory(req.body);
        res.status(201).json(category);
    } catch (e) {
        if (e.code === "P2002") {
            return res.status(409).json({ error: "Slug already in use" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await categoriesService.updateCategory(req.params.id, req.body);
        res.json(category);
    } catch (e) {
        if (e.code === "P2025") {
            return res.status(404).json({ error: "Category not found" });
        }
        if (e.code === "P2002") {
            return res.status(409).json({ error: "Slug already in use" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" })
    }
};

const deleteCategory = async (req, res) => {
    try {
        await categoriesService.deleteCategory(req.params.id);
        res.json({ ok: true, message: "Category deleted" });
    } catch (e) {
        if(e.code === "P2025") {
            return res.status(404).json({ error: "Category not found" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };