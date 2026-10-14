// URL base de la API, que sirve tanto /api como /uploads (imágenes).
// Vacía por defecto: las rutas quedan relativas y van al mismo dominio que el frontend.
// En local las reenvía el proxy de Vite (vite.config.js) y en producción el servidor web,
// así que el navegador no hace peticiones a otro dominio y no hay CORS de por medio.
// Rellenar VITE_API_URL solo si una variante tiene la API en otro dominio
// (por ejemplo https://api.mitienda.com); entonces sí hará falta CORS en la API.
export const API_URL = import.meta.env.VITE_API_URL || ''

// Datos de marca: cada variante de la tienda los cambia en su .env sin tocar componentes.
// Ojo: todo lo VITE_ acaba dentro del JavaScript que descarga el navegador, así que es público.
export const STORE_NAME = import.meta.env.VITE_STORE_NAME || 'Mi Tienda'

// Correo de contacto que se enseña al cliente (no es al que llegan los mensajes del formulario)
export const STORE_EMAIL = import.meta.env.VITE_STORE_EMAIL || 'info@mitienda.com'

// Helper para construir la URL completa de una imagen.
// Las imágenes vienen como rutas relativas (/uploads/products/...)
// y se les pone delante API_URL, porque es la API quien sirve /uploads
// (normalmente API_URL está vacía y la ruta se queda tal cual).
export function imageUrl(path) {
  if (!path) return '' // si no hay imagen devolvemos string vacío
  return `${API_URL}${path}`
}

// Formatea un precio al formato € 15,00 (símbolo delante, coma decimal)
export function formatPrice(price) {
  return `€ ${Number(price).toFixed(2).replace('.', ',')}`
}