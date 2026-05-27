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

export { uploadProductImage, setPrimaryImage, deleteProductImage };