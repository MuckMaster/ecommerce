import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ProductCard/ProductCard'
import { API_URL } from '../../config'
import './Catalogue.css'

// Materiales que consideramos "piel" — el resto se considera "tela"
const PIEL_MATERIALS = ['piel', 'cuero', 'ante']

function Catalogue() {
  const [searchParams] = useSearchParams()
  const tipo = searchParams.get('t') // 'tela' | 'piel' | null

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/products`)
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
  }, [])

  // Filtramos según el material del producto
  const filteredProducts = products.filter(p => {
    if (!tipo) return true // sin filtro mostramos todos

    // Normalizamos el material a minúsculas para comparar
    const material = (p.material || '').toLowerCase()
    const esPiel = PIEL_MATERIALS.some(m => material.includes(m))

    return tipo === 'piel' ? esPiel : !esPiel
  })

  return (
    <main className="catalogue">
      <div className="catalogue__header">
        <h1 className="catalogue__title">
          {tipo === 'tela' && 'Bolsos de tela'}
          {tipo === 'piel' && 'Bolsos de piel'}
          {!tipo && 'Catálogo completo'}
        </h1>
        <span className="catalogue__count">{filteredProducts.length} productos</span>
      </div>

      {loading ? (
        <p className="catalogue__loading">Cargando productos...</p>
      ) : error ? (
        <p className="catalogue__error">{error}</p>
      ) : (
        <div className="catalogue__grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}

export default Catalogue