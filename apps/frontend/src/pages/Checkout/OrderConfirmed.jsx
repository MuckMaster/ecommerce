import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useCart } from '../../context/CartContext'
import './OrderConfirmed.css'

function OrderConfirmed() {
  const navigate = useNavigate()
  const { fetchCart } = useCart()

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