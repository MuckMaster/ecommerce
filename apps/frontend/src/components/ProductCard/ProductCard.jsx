import { useNavigate } from 'react-router-dom'
import './ProductCard.css'

function ProductCard({ product }) {
    const navigate = useNavigate()

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
                <img 
                    className="product-card__img"
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                />
            </div>

            <div className="product-card__info">
                <div className="product-card__row">
                    <span className="product-card__name">{product.name}</span>
                    <span className="product-card__price">{product.price}€</span>
                </div>
                <span className="product-card__color">{product.color}</span>
            </div>
        </article>
    )
}

export default ProductCard