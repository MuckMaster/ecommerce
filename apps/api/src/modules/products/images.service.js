import { prisma } from "../../lib/prisma.js";
import fs from "fs";
import path from "path";

const getPublicUrl = (filename) => `/uploads/products/${filename}`;

const formatImage = (image) => ({
    id: String(image.id),
    product_id: String(image.product_id),
    variant_id: image.variant_id ? String(image.variant_id) : null,
    url: image.url,
    alt_text: image.sort_order,
    sort_order: image.sort_order,
    is_primary: image.is_primary,
    created_at: image.created_at,
});

const uploadProductImage = async (productId, file, { alt_text, is_primary } = {}) => {
    const product = await prisma.products.findUnique({
        where: { id: BigInt(productId) }
    });

    if (!product) {
        fs.unlinkSync(file.path);
        const error = new Error ("Product not found");
        error.code = "PRODUCT_NOT_FOUND";
        throw error;
    }

    if (is_primary) {
        await prisma.product_images.updateMany({
            where: { product_id: BigInt(productId), is_primary: true },
            data: { is_primary: false },
        });
    }

    const lastImage = await prisma.product_images.findFirst({
        where: { product_id: BigInt(productId) },
        orderBy: { sort_order: "desc" },
    });

    const sortOrder = lastImage ? lastImage.sort_order + 1: 0;

    const image = await prisma.product_images.create({
        data: {
        product_id: BigInt(productId),
        url: getPublicUrl(file.filename),
        alt_text: alt_text || product.name,
        sort_order: sortOrder,
        is_primary: is_primary || false,
        },
    });

    return formatImage(image);
};

const setPrimaryImage =async (productId, imageId) => {
    await prisma.product_images.updateMany({
       where: { product_id: BigInt(productId) },
       data: { is_primary: false },
    });

    const image = await prisma.product_images.update({
        where: { id: BigInt(imageId) },
        data: { is_primary: true },
    })

    return formatImage(image);
};

const deleteProductImage = async (imageId) => {

  const image = await prisma.product_images.findUnique({
    where: { id: BigInt(imageId) },
  });

  if (!image) {
    const error = new Error("Image not found");
    error.code = "IMAGE_NOT_FOUND";
    throw error;
  }

  const filename = path.basename(image.url); // "abc.jpg"
  const filepath = path.join(process.cwd(), "uploads", "products", filename);

  // Si el archivo existe, lo borramos. Si no, ignoramos (puede que ya no exista)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  await prisma.product_images.delete({
    where: { id: BigInt(imageId) },
  });
};

// Reasigna una imagen existente a una variante (o al producto general si variantId es null)
// Útil cuando el admin quiere mover imágenes entre variantes o convertir imágenes
// del producto en imágenes de una variante concreta
const reassignImage = async (imageId, variantId) => {
    // Buscamos la imagen para verificar que existe y obtener su product_id
    const image = await prisma.product_images.findUnique({
        where: { id: BigInt(imageId) },
    });

    if (!image) {
        const error = new Error("Image not found");
        error.code = "IMAGE_NOT_FOUND";
        throw error;
    }

    // Si nos dan variantId, verificamos que la variante existe Y pertenece al mismo producto
    // Esto evita mover una imagen a una variante de otro producto
    if (variantId) {
        const variant = await prisma.product_variants.findFirst({
            where: {
                id: BigInt(variantId),
                product_id: image.product_id,
            },
        });

        if (!variant) {
            const error = new Error("Variant not found or does not belong to this product");
            error.code = "VARIANT_NOT_FOUND";
            throw error;
        }
    }

    // Actualizamos solo el campo variant_id
    // Si variantId es null, la imagen queda como del producto general
    const updated = await prisma.product_images.update({
        where: { id: BigInt(imageId) },
        data: {
            variant_id: variantId ? BigInt(variantId) : null,
        },
    });

    // Devolvemos la imagen con formato serializado (BigInt a String)
    return {
        id: String(updated.id),
        product_id: String(updated.product_id),
        variant_id: updated.variant_id ? String(updated.variant_id) : null,
        url: updated.url,
        alt_text: updated.alt_text,
        sort_order: updated.sort_order,
        is_primary: updated.is_primary,
        created_at: updated.created_at,
    };
};

export { uploadProductImage, setPrimaryImage, deleteProductImage, reassignImage };