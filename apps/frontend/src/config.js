// import.meta.env.VITE_API_URL lo defines al compilar para producción;
// si no existe (desarrollo), usa tu Laravel local de siempre
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// URL base para archivos estáticos (imágenes): SIN /index.php,
// porque son archivos que sirve Apache directamente, no pasan por Laravel.
export const ASSET_URL = import.meta.env.VITE_ASSET_URL || 'http://localhost:3000'

// Helper para construir la URL completa de una imagen.
// Las imágenes vienen como rutas relativas (/uploads/products/...)
// y hay que concatenarlas con la URL base de la API.
export function imageUrl(path) {
  if (!path) return '' // si no hay imagen devolvemos string vacío
  return `${ASSET_URL}${path}`   // ← ASSET_URL (sin /index.php), no API_URL
}

// Formatea un precio al formato € 15,00 (símbolo delante, coma decimal)
export function formatPrice(price) {
  return `€ ${Number(price).toFixed(2).replace('.', ',')}`
}