import { useState, useEffect } from 'react'
import ProductCard from '../../components/ProductCard/ProductCard'
import { API_URL } from '../../config'
import './Home.css'

function Home() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch(`${API_URL}/api/products`)
        if (!res.ok) return
        const data = await res.json()
        const destacados = data.filter(p => p.is_featured)
        setFeatured(destacados.length > 0 ? destacados : data)
      } catch (err) {
        console.error('Error al cargar destacados:', err)
      }
    }
    fetchFeatured()
  }, [])

  return (
    <main className="home">
      <section className="home__featured" aria-label="Productos">

        {/* Imagen hero a todo el ancho — asset estático desde /public/images */}
      <section className="home__hero" aria-label="Imagen principal">
        <img
          src="../images/home/home.jpg"
          alt="Rivet Bags"
          className="home__hero-img"
        />
      </section>

        <div className="home__featured-grid">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default Home