import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import './Cart.css'

// Página del carrito. No tiene estado propio: todo sale del CartContext,
// así el contador de la navbar y esta vista nunca se desincronizan.
function Cart() {
  const navigate = useNavigate()
  const { cart, loading, updateItem, removeItem, clearCart } = useCart()

  if (loading) return <div className="cart__loading">Cargando carrito...</div>

  // El backend devuelve null cuando el carrito se ha vaciado,
  // por eso se comprueban los dos casos.
  const isEmpty = !cart || cart.items.length === 0

  return (
    <main className="cart">
      <div className="cart__wrap">

        <div className="cart__header">
          <button className="cart__back" onClick={() => navigate(-1)}>← Volver</button>
          <h1 className="cart__title">Tu carrito</h1>
        </div>

        {isEmpty ? (
          <div className="cart__empty">
            <p>Tu carrito está vacío.</p>
            <button
              className="cart__btn-catalogue"
              onClick={() => navigate('/catalogo')}
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <div className="cart__content">

            <div className="cart__items">
              {cart.items.map(item => (
                <div key={item.id} className="cart__item">

                  {/* Info del producto */}
                  <div className="cart__item-info">
                    <span className="cart__item-name">{item.product.name}</span>
                    <span className="cart__item-price">{item.unit_price}€</span>
                  </div>

                  <div className="cart__item-controls">
                    {/* Bajar de 1 unidad equivale a quitar la línea:
                        así no queda un item con cantidad 0 en el carrito. */}
                    <button
                      className="cart__qty-btn"
                      onClick={() => item.qty > 1
                        ? updateItem(item.id, item.qty - 1)
                        : removeItem(item.id)
                      }
                    >
                      −
                    </button>
                    <span className="cart__qty">{item.qty}</span>
                    <button
                      className="cart__qty-btn"
                      onClick={() => updateItem(item.id, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>

                  <span className="cart__item-total">{item.line_total}€</span>


                  <button
                    className="cart__item-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Eliminar ${item.product.name}`}
                  >
                    ×
                  </button>

                </div>
              ))}
            </div>

            <div className="cart__summary">
              <div className="cart__summary-row">
                <span>Total</span>
                <span className="cart__total">{cart.total}€</span>
              </div>
              <button
                className="cart__btn-checkout"
                onClick={() => navigate('/checkout')}
              >
                Finalizar pedido
              </button>
              <button
                className="cart__btn-clear"
                onClick={clearCart}
              >
                Vaciar carrito
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}

export default Cart