import './ProductCard.css'

function ProductCard({ product, onNavigate }) {
    return (
        <article
        className="product-card"
        onClick={() => onNavigate('detail', product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onNavigate('detail', product)}
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