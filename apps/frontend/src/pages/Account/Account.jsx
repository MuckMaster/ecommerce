import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Account.css'

const API_URL = 'http://localhost:3000'

function Account() {
  const navigate = useNavigate()
  const { user, accessToken, logout, apiFetch, ready } = useAuth()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if(!user || !ready) return
    async function fetchOrders() {
      setLoadingOrders(true)
      try {
        console.log('accesToken', accessToken)
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        console.log('Status', res.status)
        const data = await res.json()
        console.log('Datos:', data)
        console.log('Es array:', Array.isArray(data))
        console.log('Length:', data.length)
        setOrders(Array.isArray(data) ? data : data.orders || [])
      } catch (err) {
          console.error('Error al cargar pedidos:', err)
        } finally {
            setLoadingOrders(false)
          }
    }
  fetchOrders()
  }, [user, ready])

  useEffect(() => {
    if (!user) navigate('/')
  }, [user])

  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <main className="account">

      <div className="account__wrap">

        {/* Cabecera */}
        <div className="account__header">
          <h1 className="account__title">Mi cuenta</h1>
          <button className="account__logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <section className="account__section">
          <h2 className="account__section-title">Datos personales</h2>
          <div className="account__card">
            <div className="account__field">
              <span className="account__field-label">Nombre</span>
              <span className="account__field-value">{user.name}</span>
            </div>
            <div className="account__field">
              <span className="account__field-label">Correo electrónico</span>
              <span className="account__field-value">{user.email}</span>
            </div>
          </div>
        </section>
        <section className="account__section">
          <h2 className="account__section-title">Historial de pedidos</h2>


          {loadingOrders && (
            <p className="accoiunt__loading">Cargando pedidos...</p>
          )}

          {!loadingOrders && orders.length === 0 && (
            <div className="account__empty">
                <p>No tienes pedidos todavía.</p>
            </div>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div className="account__orders">
                {orders.map(order => (
                <div 
                  key={order.id}
                  className="account__order"
                  onClick={() => navigate(`/pedido/${order.id}`)}
                >
                    <div className="account__order-row">
                    <span className="account__order-id">#{order.id}</span>
                    <span className="account__order-date">
                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="account__order-status">{order.status}</span>
                    <span className="account__order-total">{order.total}€</span>
                    </div>
                </div>
                ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}

export default Account