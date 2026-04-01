import * as productsService from "./products.service.js";

const getProducts = async (req, res) => {
    try {
        const { status, featured, category } = req.query;
        const products = await productsService.getProducts({ status, featured, category });
        res.json(products);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getProductById = async (req, res) => {

    try {
        const product = await productsService.getProductById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const searchProducts = async (req, res) => {

    try {
        const { q } = req.query;
        const products = await productsService.searchProducts(q);
        res.json(products);
    } catch (e) {
        console.error(e);
        res.status(500).json({  error: "Internal server error" });
    }

};

const createProduct = async (req, res) => {

    try{
        const { name, slug, price } = req.body;

        if(!name || !slug || price === undefined) {
            return res.status(400).json({ error: "Missing required fields: name, slug, price" });
        }

        const product = await productsService.createProduct(req.body);
        res.status(201).json(product);
    } catch (e) {
        if(e.code === "P2002") {
            return res.status(409).json({ error: "Slug already in use" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const updateProduct = async (req, res) => {

    try {
        const product = await productsService.updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (e) {
        if (e.code === "P2025") {
            return res.status(404).json({ error: "Product not foudn" });
        }
        if (e.code === "P2002") {
            return res.status(409).json({ error: "Slug already in use" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

const deleteProduct = async (req, res) => {

    try {
        await productsService.deleteProduct(req.params.id);
        res.json({ ok: true, message: "Product deleted" });
    } catch (e) {
        if (e.code === "P2025") {
            return res.status(404).json({ error: "Product not found" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }

};

export { getProducts, getProductById, searchProducts, createProduct, updateProduct, deleteProduct };
