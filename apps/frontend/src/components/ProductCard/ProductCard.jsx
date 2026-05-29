import { useNavigate } from 'react-router-dom'
import { imageUrl, formatPrice } from '../../config'
import './ProductCard.css'

function ProductCard({ product }) {
  const navigate = useNavigate()

  // Buscamos la imagen principal, o la primera si no hay ninguna marcada
  const primaryImage =
    product.product_images?.find(img => img.is_primary) ||
    product.product_images?.[0]

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