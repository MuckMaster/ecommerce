import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import './AdminDashboard.css'

// Pantalla de inicio del panel: cifras de pedidos e ingresos.
// Todos los cálculos vienen ya hechos del endpoint de stats.
function AdminDashboard() {
  const { apiFetch } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiFetch('/api/admin/orders/stats')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al cargar estadísticas')
        }
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Estas dos salidas tempranas son obligatorias: el render de abajo accede
  // a stats.orders / stats.revenue sin comprobar nulos y reventaría
  // si se pintara antes de que llegue la respuesta.
  if (loading) return <div className="admin-loading">Cargando...</div>
  if (error) return <div className="admin-error">{error}</div>

  return (
    <div className="admin-dashboard">
      <h1 className="admin-page-title">Dashboard</h1>

      {/* Tarjetas de estadísticas de pedidos */}
      <section className="admin-section">
        <h2 className="admin-section-title">Pedidos</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Total pedidos</span>
            <span className="admin-stat-card__value">{stats.orders.total}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Pendientes</span>
            <span className="admin-stat-card__value admin-stat-card__value--warning">
              {stats.orders.pending}
            </span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Pagados</span>
            <span className="admin-stat-card__value admin-stat-card__value--success">
              {stats.orders.paid}
            </span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Enviados</span>
            <span className="admin-stat-card__value">{stats.orders.shipped}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Hoy</span>
            <span className="admin-stat-card__value">{stats.orders.today}</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__label">Este mes</span>
            <span className="admin-stat-card__value">{stats.orders.this_month}</span>
          </div>
        </div>
      </section>

      {/* Tarjetas de ingresos */}
      <section className="admin-section">
        <h2 className="admin-section-title">Ingresos</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card admin-stat-card--large">
            <span className="admin-stat-card__label">Total ingresos</span>
            <span className="admin-stat-card__value admin-stat-card__value--revenue">
              {stats.revenue.total.toFixed(2)}€
            </span>
          </div>
          <div className="admin-stat-card admin-stat-card--large">
            <span className="admin-stat-card__label">Este mes</span>
            <span className="admin-stat-card__value admin-stat-card__value--revenue">
              {stats.revenue.this_month.toFixed(2)}€
            </span>
          </div>
          <div className="admin-stat-card admin-stat-card--large">
            <span className="admin-stat-card__label">Últimos 30 días</span>
            <span className="admin-stat-card__value admin-stat-card__value--revenue">
              {stats.revenue.last_30_days.toFixed(2)}€
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard