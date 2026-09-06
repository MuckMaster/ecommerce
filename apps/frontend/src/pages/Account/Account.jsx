import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Account.css'
import { API_URL } from '../../config.js'   // ajusta los ../ según la profundidad de cada archivo

// Área privada del cliente: sus datos personales y su historial de pedidos.
function Account() {
  const navigate = useNavigate()
  const { user, accessToken, logout, apiFetch, ready } = useAuth()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Carga de pedidos. Se espera a `ready` porque hasta que no termina la
  // restauración de sesión el accessToken todavía es null y la petición
  // se iría sin autorización.
  useEffect(() => {
    if(!user || !ready) return
    async function fetchOrders() {
      setLoadingOrders(true)
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const data = await res.json()
        // El endpoint puede responder un array plano o un objeto { orders: [...] };
        // se normalizan ambos casos para que el render siempre reciba un array.
        setOrders(Array.isArray(data) ? data : data.orders || [])
      } catch (err) {
          console.error('Error al cargar pedidos:', err)
        } finally {
            setLoadingOrders(false)
          }
    }
  fetchOrders()
  }, [user, ready])

  // Protege la ruta: si no hay usuario (o acaba de cerrar sesión) se sale al home.
  useEffect(() => {
    if (!user) navigate('/')
  }, [user])

  // Evita pintar la pantalla durante el render previo a la redirección.
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

          {/* Los tres bloques siguientes son excluyentes: cargando,
              sin pedidos, o listado. Todos comprueban !loadingOrders
              para no mostrar el "no tienes pedidos" mientras se cargan. */}
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