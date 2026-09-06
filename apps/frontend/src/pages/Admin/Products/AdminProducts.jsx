import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import '../Orders/AdminOrders.css'
import './AdminProducts.css'

// Listado de productos del panel, con acceso a crear, editar y eliminar.
// El alta y la edición viven en AdminProductForm.
function AdminProducts() {
  const navigate = useNavigate()
  const { apiFetch } = useAuth()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/products')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar productos')
      }
      // GET /api/products devuelve directamente un array []
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return

    try {
      const res = await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      // Eliminamos el producto del estado local sin recargar toda la lista
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-products">
      <div className="admin-products__header">
        <h1 className="admin-page-title">Productos</h1>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => navigate('/admin/productos/nuevo')}
        >
          + Nuevo producto
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Cargando productos...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Destacado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    No hay productos todavía
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="admin-table__row">
                    <td>{product.name}</td>
                    <td className="admin-table__mono">{product.slug}</td>
                    <td>{product.price}€</td>
                    <td>
                      {/* El estado llega en mayúsculas (PUBLISHED / DRAFT) y se
                          pasa a minúsculas para componer el modificador CSS */}
                      <span className={`admin-product-status admin-product-status--${product.status.toLowerCase()}`}>
                        {product.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td>{product.is_featured ? '★' : '—'}</td>
                    <td className="admin-table__actions">
                      <button
                        className="admin-btn admin-btn--sm"
                        onClick={() => navigate(`/admin/productos/${product.id}`)}
                      >
                        Editar
                      </button>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminProducts