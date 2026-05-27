import * as variantsService from "./variants.service.js";

// req.params.id viene del router padre (productVariantsRoutes con mergeParams: true)
const getVariantsByProduct = async (req, res) => {
  try {
    const variants = await variantsService.getVariantsByProduct(req.params.id);
    res.json(variants);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createVariant = async (req, res) => {
  try {
    const { sku, color } = req.body;

    if (!sku || !color) {
      return res.status(400).json({ error: "Missing required fields: sku, color" });
    }

    const variant = await variantsService.createVariant(req.params.id, req.body);
    res.status(201).json(variant);
  } catch (e) {
    if (e.code === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ error: "Product not found" });
    }
    if (e.code === "P2002") {
      return res.status(409).json({ error: "SKU already in use" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateVariant = async (req, res) => {
  try {
    const variant = await variantsService.updateVariant(req.params.variantId, req.body);
    res.json(variant);
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Variant not found" });
    }
    if (e.code === "P2002") {
      return res.status(409).json({ error: "SKU already in use" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteVariant = async (req, res) => {
  try {
    await variantsService.deleteVariant(req.params.variantId);
    res.json({ ok: true, message: "Variant deleted" });
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Variant not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getVariantsByProduct, createVariant, updateVariant, deleteVariant };