import ProductCard from '../../components/ProductCard/ProductCard'
import { products } from '../../data/products'
import './Catalogue.css'
import { useSearchParams } from 'react-router-dom'

function Catalogue({ onNavigate }) {

    const [searchParams] = useSearchParams()
    const tipo = searchParams.get('t') // 'tela' o 'piel'

    const filteredProducts = tipo
    ? products.filter(p => p.type === tipo)
    :products

    return(
        <main className="catalogue">
            <div className="catalogue__header">
                <h1 className="catalogue__title">
                    {tipo === 'tela' && 'Bolsos de tela'}
                    {tipo === 'piel' && 'Bolsos de piel'}
                    {!tipo && 'Catálogo completo'}
                </h1>
                <span className="catalogue__count">{filteredProducts.length} productos</span>
            </div>

            <div className="catalogue__grid">
                {filteredProducts.map(product => (
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