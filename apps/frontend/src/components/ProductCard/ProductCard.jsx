import { useNavigate } from 'react-router-dom'
import { imageUrl, formatPrice } from '../../config'
import './ProductCard.css'

// Tarjeta de producto reutilizable (catálogo y destacados del home).
// La tarjeta entera es clicable: se marca con role/tabIndex/onKeyDown
// para que también funcione con teclado, ya que no es un <a> ni un <button>.
function ProductCard({ product }) {
  const navigate = useNavigate()

  // Buscamos la imagen principal, o la primera si no hay ninguna marcada
  const primaryImage =
    product.product_images?.find(img => img.is_primary) ||
    product.product_images?.[0]

  // La API devuelve rutas relativas; imageUrl las completa con API_URL.
  const thumbnail = primaryImage ? imageUrl(primaryImage.url) : ''

  return (
    <article
      className="product-card"
      onClick={() => navigate(`/producto/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/producto/${product.id}`)}
      aria-label={`Ver ${product.name}`}
    >
      {/* El wrapper se pinta siempre aunque no haya imagen: mantiene
          la altura de la tarjeta y evita que la rejilla se descuadre. */}
      <div className="product-card__img-wrap">
        {thumbnail && (
          <img
            className="product-card__img"
            src={thumbnail}
            alt={primaryImage?.alt_text || product.name}
            loading="lazy"
          />
        )}
      </div>

      <div className="product-card__info">
        <span className="product-card__name">{product.name}</span>
        <span className="product-card__price">{formatPrice(product.price)}</span>
      </div>
    </article>
  )
}

export default ProductCard