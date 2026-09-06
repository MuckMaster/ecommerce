import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useCart } from '../../context/CartContext'
import './OrderConfirmed.css'

// Pantalla de vuelta desde Stripe tras un pago correcto.
function OrderConfirmed() {
  const navigate = useNavigate()
  const { fetchCart } = useCart()

  // El carrito lo vacía el backend al confirmar el pedido, así que al volver
  // hay que recargarlo para que el contador de la navbar no siga marcando
  // los artículos ya comprados.
  useEffect(() => {
    fetchCart()
  }, [])

  return (
    <main className="confirmed">
      <div className="confirmed__wrap">
        <div className="confirmed__icon">✓</div>
        <h1 className="confirmed__title">¡Pedido confirmado!</h1>
        <p className="confirmed__text">
          Hemos recibido tu pedido correctamente. Recibirás un email de confirmación en breve.
        </p>
        <div className="confirmed__actions">
          <button
            className="confirmed__btn-account"
            onClick={() => navigate('/mi-cuenta')}
          >
            Ver mis pedidos
          </button>
          <button
            className="confirmed__btn-catalogue"
            onClick={() => navigate('/catalogo')}
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </main>
  )
}

export default OrderConfirmed