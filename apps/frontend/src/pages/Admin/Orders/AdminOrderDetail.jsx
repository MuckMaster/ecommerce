import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import '../Orders/AdminOrders.css'

const ORDER_STATUSES = {
  PENDING:   'Pendiente',
  PAID:      'Pagado',
  SHIPPED:   'Enviado',
  CANCELLED: 'Cancelado',
  REFUNDED:  'Reembolsado',
}

function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apiFetch } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estado para el cambio de estado del pedido
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/admin/orders/${id}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar el pedido')
      }
      const data = await res.json()
      setOrder(data)
      setNewStatus(data.status) // inicializamos el select con el estado actual
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate() {
    if (newStatus === order.status) return
    setUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      const res = await apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          // Solo mandamos comment si tiene valor
          ...(comment ? { comment } : {})
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el estado')
      }

      setUpdateSuccess(true)
      setComment('')
      // Recargamos el pedido para ver el historial actualizado
      await fetchOrder()
    } catch (err) {
      setUpdateError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="admin-loading">Cargando pedido...</div>
  if (error) return <div className="admin-error">{error}</div>

  return (
    <div className="admin-order-detail">
      <button className="admin-btn-back" onClick={() => navigate('/admin/pedidos')}>
        ← Volver a pedidos
      </button>

      <div className="admin-order-detail__header">
        <h1 className="admin-page-title">{order.order_number}</h1>
        <span className="admin-order-detail__date">
          {new Date(order.created_at).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric'
          })}
        </span>
      </div>

      <div className="admin-order-detail__grid">

        {/* Datos del cliente y envío */}
        <div className="admin-card">
          <h2 className="admin-card__title">Cliente y envío</h2>
          <div className="admin-card__rows">
            <div className="admin-card__row">
              <span className="admin-card__label">Nombre</span>
              <span>{order.shipping_name}</span>
            </div>
            <div className="admin-card__row">
              <span className="admin-card__label">Email</span>
              <span>{order.email}</span>
            </div>
            {order.shipping_phone && (
              <div className="admin-card__row">
                <span className="admin-card__label">Teléfono</span>
                <span>{order.shipping_phone}</span>
              </div>
            )}
            <div className="admin-card__row">
              <span className="admin-card__label">Dirección</span>
              <span>
                {order.shipping_address_line1}
                {order.shipping_address_line2 && `, ${order.shipping_address_line2}`}
              </span>
            </div>
            <div className="admin-card__row">
              <span className="admin-card__label">Ciudad</span>
              <span>{order.shipping_city}, {order.shipping_postcode}</span>
            </div>
            {order.notes && (
              <div className="admin-card__row">
                <span className="admin-card__label">Notas</span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cambiar estado */}
        <div className="admin-card">
          <h2 className="admin-card__title">Estado del pedido</h2>

          {updateSuccess && (
            <div className="admin-success">Estado actualizado correctamente.</div>
          )}
          {updateError && (
            <div className="admin-error">{updateError}</div>
          )}

          <div className="admin-status-form">
            <select
              className="admin-input admin-select"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
            >
              {Object.entries(ORDER_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <textarea
              className="admin-input admin-textarea"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Comentario opcional (ej: enviado por correo certificado)"
              rows={3}
            />

            <button
              className="admin-btn admin-btn--primary"
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
            >
              {updating ? 'Actualizando...' : 'Actualizar estado'}
            </button>
          </div>
        </div>

        {/* Items del pedido */}
        <div className="admin-card admin-card--full">
          <h2 className="admin-card__title">Productos</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Total línea</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td>{item.product?.name || 'Producto eliminado'}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit_price}€</td>
                  <td>{item.line_total}€</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-order-detail__totals">
            {order.discount > 0 && (
              <div className="admin-order-detail__total-row">
                <span>Descuento</span>
                <span>-{order.discount}€</span>
              </div>
            )}
            {order.shipping > 0 && (
              <div className="admin-order-detail__total-row">
                <span>Envío</span>
                <span>{order.shipping}€</span>
              </div>
            )}
            <div className="admin-order-detail__total-row admin-order-detail__total-row--total">
              <span>Total</span>
              <span>{order.total}€</span>
            </div>
          </div>
        </div>

        {/* Historial de estados */}
        {order.history && order.history.length > 0 && (
          <div className="admin-card admin-card--full">
            <h2 className="admin-card__title">Historial</h2>
            <div className="admin-history">
              {order.history.map((entry, i) => (
                <div key={i} className="admin-history__entry">
                  <div className="admin-history__dot" />
                  <div className="admin-history__content">
                    <span className="admin-history__status">
                      {ORDER_STATUSES[entry.status] || entry.status}
                    </span>
                    {entry.comment && (
                      <span className="admin-history__comment">{entry.comment}</span>
                    )}
                    <span className="admin-history__date">
                      {new Date(entry.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminOrderDetail