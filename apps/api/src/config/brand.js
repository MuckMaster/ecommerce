// Configuración de marca de la tienda.
// Es el único sitio de la API que lee las variables de marca: así cada variante
// cambia su nombre y su prefijo de pedido solo con el .env, sin tocar código.
// Si una variable falta o está vacía, se usa un valor neutro para que la API arranque igual.

// Nombre visible de la tienda (por ejemplo, en el remitente de los correos)
export const STORE_NAME = process.env.STORE_NAME || "Mi Tienda";

// Prefijo del número de pedido, sin guion: el guion lo pone quien monta el número
export const ORDER_PREFIX = process.env.ORDER_PREFIX || "ORD";
