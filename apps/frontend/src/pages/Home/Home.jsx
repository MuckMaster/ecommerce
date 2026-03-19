import Carousel from '../../components/Carousel/Carousel'
import ProductCard from '../../components/ProductCard/ProductCard'
import { carouselImages, products } from '../../data/products'
import './Home.css'

function Home () {
    const featured = products.slice(0,4)

    return(
        <main className="home">
            <Carousel images={carouselImages} />

            <section className="home__featured" aria-label="Productos">
                <div classname="home-featured-header">
                </div>

                <div className="home__featured-grid">
                    {featured.map(product => (
                        <ProductCard
                        key={product.id}
                        product={product}
                    />
                    ))}
                </div>
            </section>
        </main>
    )
}

export default Home