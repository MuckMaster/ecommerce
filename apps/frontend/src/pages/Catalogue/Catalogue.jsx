import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ProductCard/ProductCard'
import { API_URL } from '../../config'
import './Catalogue.css'

// Listado de productos. Sirve tanto para el catálogo completo como para
// el filtrado por categoría: lo decide el parámetro ?cat= de la URL,
// de modo que cada filtro es una URL compartible y navegable con el historial.
function Catalogue() {
  const [searchParams] = useSearchParams()
  const catSlug = searchParams.get('cat') // slug de categoría o null

  const [products, setProducts] = useState([])
  const [categoryName, setCategoryName] = useState('') // para el título
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        // Si hay categoría, se la pasamos a la API (filtra en el backend)
        const url = catSlug
          ? `${API_URL}/api/products?category=${catSlug}`
          : `${API_URL}/api/products`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Error al cargar productos')
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [catSlug]) // recarga cuando cambia la categoría

  return (
    <main className="catalogue">
      <div className="catalogue__header">
        <h1 className="catalogue__title">
          {catSlug ? `Categoría: ${catSlug}` : 'Catálogo completo'}
        </h1>
        <span className="catalogue__count">{products.length} productos</span>
      </div>

      {/* Tres estados excluyentes: cargando, error o rejilla de productos */}
      {loading ? (
        <p className="catalogue__loading">Cargando productos...</p>
      ) : error ? (
        <p className="catalogue__error">{error}</p>
      ) : (
        <div className="catalogue__grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}

export default Catalogue