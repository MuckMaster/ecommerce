import ProductCard from '../../components/ProductCard/ProductCard'
import { products } from '../../data/products'
import './Catalogue.css'

function Catalogue({ onNavigate }) {

    return(
        <main className="catalogue">
            <div className="catalogue__header">
                <h1 className="catalogue__title">Colección</h1>
                <span className="catalogue__count">{products.length} productos</span>
            </div>

            <div className="catalogue__grid">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>

        </main>
    )

}

export default Catalogue