// import.meta.env.VITE_API_URL lo defines al compilar para producción;
// si no existe (desarrollo), usa tu Laravel local de siempre
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Helper para construir la URL completa de una imagen.
// Las imágenes vienen como rutas relativas (/uploads/products/...)
// y hay que concatenarlas con la URL base de la API.
export function imageUrl(path) {
  if (!path) return '' // si no hay imagen devolvemos string vacío
  return `${API_URL}${path}`
}

// Formatea un precio al formato € 15,00 (símbolo delante, coma decimal)
export function formatPrice(price) {
  return `€ ${Number(price).toFixed(2).replace('.', ',')}`
}