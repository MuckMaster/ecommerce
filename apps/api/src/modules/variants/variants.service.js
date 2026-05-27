import { prisma } from "../../lib/prisma.js";

const eurosToCents = (euros) => Math.round(parseFloat(euros) * 100);
const centsToEuros = (cents) => parseFloat((cents / 100).toFixed(2));

// Mapa de colores por defecto si el admin no introduce CSS
// Se usa como fallback cuando color_css es null
const defaultColorMap = {
  negro: "#000000",
  blanco: "#FFFFFF",
  rojo: "#DC143C",
  azul: "#1E90FF",
  verde: "#228B22",
  amarillo: "#FFD700",
  naranja: "#FF8C00",
  marron: "#8B4513",
  beige: "#F5F5DC",
  gris: "#808080",
  rosa: "#FFC0CB",
  morado: "#9370DB",
};

// Devuelve el CSS apropiado: el del admin, el del mapa por defecto o un gris neutro
const resolveColorCss = (colorName, customCss) => {
  if (customCss) return customCss; // Si el admin metió CSS, lo usamos
  const key = colorName.toLowerCase().trim();
  return defaultColorMap[key] || "#CCCCCC"; // Fallback al mapa o gris si no hay match
};

// Formatea una variante para el frontend
// Importante: el formato debe coincidir con lo que espera el componente swatches
const formatVariant = (variant) => ({
  id: String(variant.id),
  product_id: String(variant.product_id),
  sku: variant.sku,
  name: variant.color,                                              // El frontend usa swatch.name
  css: resolveColorCss(variant.color, variant.color_css),           // El frontend usa swatch.css
  price: variant.price_cents ? centsToEuros(variant.price_cents) : null,
  stock_qty: variant.stock_qty,
  is_active: variant.is_active,
  images: variant.product_images?.map((img) => ({
    id: String(img.id),
    url: img.url,
    alt_text: img.alt_text,
    sort_order: img.sort_order,
    is_primary: img.is_primary,
  })) || [],
});

// Listar variantes de un producto
const getVariantsByProduct = async (productId) => {
  const variants = await prisma.product_variants.findMany({
    where: {
      product_id: BigInt(productId),
      is_active: true, // Solo variantes activas para el público
    },
    include: {
      // Incluimos imágenes ordenadas por sort_order ascendente
      product_images: { orderBy: { sort_order: "asc" } },
    },
    orderBy: { created_at: "asc" },
  });

  return variants.map(formatVariant);
};

// Crear una variante
const createVariant = async (productId, data) => {
  const { sku, color, color_css, price, stock_qty, is_active } = data;

  // Verificamos que el producto existe
  const product = await prisma.products.findUnique({
    where: { id: BigInt(productId) },
  });

  if (!product) {
    const error = new Error("Product not found");
    error.code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const variant = await prisma.product_variants.create({
    data: {
      product_id: BigInt(productId),
      sku,
      color,
      color_css: color_css || null,                              // Si no hay CSS, se queda null y usamos el mapa
      price_cents: price !== undefined ? eurosToCents(price) : null, // Precio propio o null para usar el del producto
      stock_qty: stock_qty || 0,
      is_active: is_active !== undefined ? is_active : true,
    },
    include: { product_images: true },
  });

  return formatVariant(variant);
};

// Actualizar una variante — solo los campos que llegan
const updateVariant = async (variantId, data) => {
  const { sku, color, color_css, price, stock_qty, is_active } = data;

  const updateData = {};
  if (sku !== undefined) updateData.sku = sku;
  if (color !== undefined) updateData.color = color;
  if (color_css !== undefined) updateData.color_css = color_css;
  if (price !== undefined) updateData.price_cents = price === null ? null : eurosToCents(price);
  if (stock_qty !== undefined) updateData.stock_qty = stock_qty;
  if (is_active !== undefined) updateData.is_active = is_active;

  const variant = await prisma.product_variants.update({
    where: { id: BigInt(variantId) },
    data: updateData,
    include: { product_images: true },
  });

  return formatVariant(variant);
};

// Eliminar una variante
const deleteVariant = async (variantId) => {
  await prisma.product_variants.delete({
    where: { id: BigInt(variantId) },
  });
};

export { getVariantsByProduct, createVariant, updateVariant, deleteVariant };