import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import './AdminOrders.css'

// Estados posibles de un pedido con su color asociado
const ORDER_STATUSES = {
  PENDING:   { label: 'Pendiente',   color: '#B8860B' },
  PAID:      { label: 'Pagado',      color: '#3d7a3d' },
  SHIPPED:   { label: 'Enviado',     color: '#2B3A6B' },
  CANCELLED: { label: 'Cancelado',   color: '#c47a7a' },
  REFUNDED:  { label: 'Reembolsado', color: '#6B6259' },
}

// Listado de pedidos con búsqueda, filtros por estado y fecha, y paginación.
// El filtrado se hace en el backend: aquí solo se componen los query params.
function AdminOrders() {
  const navigate = useNavigate()
  const { apiFetch } = useAuth()

  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros — se envían como query params al backend
  const [filters, setFilters] = useState({
    status: '',
    q: '',
    from: '',
    to: '',
    page: 1,
    limit: 20,
  })

  // Solo depende de filters.page: al escribir en la búsqueda o cambiar
  // el estado no se lanza una petición por tecla; esos filtros se aplican
  // al pulsar "Buscar" (handleSearch).
  useEffect(() => {
    fetchOrders()
  }, [filters.page]) // recargamos cuando cambia la página

  async function fetchOrders() {
    setLoading(true)
    setError(null)
    try {
      // Construimos los query params solo con los filtros que tienen valor
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.q) params.set('q', filters.q)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      params.set('page', filters.page)
      params.set('limit', filters.limit)

      const res = await apiFetch(`/api/admin/orders?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar pedidos')
      }
      const data = await res.json()
      // El backend devuelve { data: [], pagination: {} }
      setOrders(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(e) {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1 // al cambiar filtros volvemos a la página 1
    }))
  }

  function handleSearch(e) {
    e.preventDefault()
    fetchOrders()
  }

  return (
    <div className="admin-orders">
      <h1 className="admin-page-title">Pedidos</h1>

      {/* Filtros */}
      <div className="admin-filters">
        <input
          className="admin-input"
          type="text"
          name="q"
          value={filters.q}
          onChange={handleFilterChange}
          placeholder="Buscar por nº pedido, email o nombre..."
        />

        <select
          className="admin-input admin-select"
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ORDER_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <input
          className="admin-input"
          type="date"
          name="from"
          value={filters.from}
          onChange={handleFilterChange}
        />

        <input
          className="admin-input"
          type="date"
          name="to"
          value={filters.to}
          onChange={handleFilterChange}
        />

        <button className="admin-btn admin-btn--primary" onClick={handleSearch}>
          Buscar
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Cargando pedidos...</div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Cliente</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table__empty">
                      No hay pedidos con estos filtros
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="admin-table__row">
                      <td className="admin-table__mono">{order.order_number}</td>
                      <td>{order.shipping_name}</td>
                      <td>{order.email}</td>
                      <td>
                        {/* Si llegara un estado nuevo no contemplado en
                            ORDER_STATUSES se muestra su código en crudo
                            en lugar de dejar la celda vacía. */}
                        <span
                          className="admin-status-badge"
                          style={{ color: ORDER_STATUSES[order.status]?.color }}
                        >
                          {ORDER_STATUSES[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td>{order.total}€</td>
                      <td>
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn--sm"
                          onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-btn admin-btn--sm"
                disabled={filters.page === 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                ← Anterior
              </button>
              <span className="admin-pagination__info">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                className="admin-btn admin-btn--sm"
                disabled={filters.page === pagination.pages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminOrders