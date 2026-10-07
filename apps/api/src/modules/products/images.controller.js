import * as imagesService from "./images.service.js";

const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { alt_text, is_primary, variant_id } = req.body;

    const isPrimary = is_primary === "true" || is_primary === true;

    const image = await imagesService.uploadProductImage(
      req.params.id,
      req.file,
      { alt_text, is_primary: isPrimary, variant_id }
    );

    res.status(201).json(image);
  } catch (e) {
    if (e.code === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ error: "Product not found" });
    }
    if (e.code === "VARIANT_NOT_FOUND") {
      return res.status(404).json({ error: "Variant not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

const setPrimaryImage = async (req, res) => {
  try {
    const image = await imagesService.setPrimaryImage(
      req.params.id,
      req.params.imageId
    );
    res.json(image);
  } catch (e) {
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Image not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    await imagesService.deleteProductImage(req.params.imageId);
    res.json({ ok: true, message: "Image deleted" });
  } catch (e) {
    if (e.code === "IMAGE_NOT_FOUND") {
      return res.status(404).json({ error: "Image not found" });
    }
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/products/:id/images/:imageId — solo ADMIN
// Reasigna una imagen a una variante o la desvincula (variantId = null)
const reassignImage = async (req, res) => {
    try {
        // variantId puede ser null explícitamente para desvincular
        const { variant_id } = req.body;

        const image = await imagesService.reassignImage(
            req.params.imageId,
            variant_id
        );

        res.json(image);
    } catch (e) {
        if (e.code === "IMAGE_NOT_FOUND") {
            return res.status(404).json({ error: "Image not found" });
        }
        if (e.code === "VARIANT_NOT_FOUND") {
            return res.status(404).json({ error: "Variant not found" });
        }
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export { uploadProductImage, setPrimaryImage, deleteProductImage, reassignImage };