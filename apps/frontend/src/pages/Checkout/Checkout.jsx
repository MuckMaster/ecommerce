import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { API_URL } from '../../config.js'
import './Checkout.css'

// Datos de envío y salto a la pasarela de pago. Esta pantalla no cobra:
// pide al backend una sesión de Stripe y redirige a su checkout alojado,
// de modo que los datos de tarjeta nunca pasan por esta aplicación.
function Checkout() {
  const navigate = useNavigate()
  const { user, accessToken } = useAuth()
  const { cart } = useCart()

  // Si hay sesión iniciada se precargan email y nombre del usuario.
  const [form, setForm] = useState({
    email: user?.email || '',
    shipping_name: user?.name || '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_postcode: '',
    shipping_country: 'ES',
    shipping_phone: '',
    notes: '',
  })

  const [status, setStatus] = useState(null)  // null | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const body = {
      email: form.email,
      shipping_name: form.shipping_name,
      shipping_address_line1: form.shipping_address_line1,
      shipping_city: form.shipping_city,
      shipping_postcode: form.shipping_postcode,
      // URLs de retorno — Stripe redirige aquí tras el pago
      successUrl: `${window.location.origin}/pedido/confirmado`,
      cancelUrl: `${window.location.origin}/carrito`,
      // Opcionales — solo los añadimos si tienen valor
      ...(form.shipping_address_line2 && { shipping_address_line2: form.shipping_address_line2 }),
      ...(form.shipping_country && { shipping_country: form.shipping_country }),
      ...(form.shipping_phone && { shipping_phone: form.shipping_phone }),
      ...(form.notes && { notes: form.notes }),
    }

    // Se identifica el pedido por token si hay sesión, y por sessionId si es
    // una compra como invitado: son excluyentes, el backend espera uno u otro.
    const sessionId = localStorage.getItem('sessionId')
    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : { 'X-Session-Id': sessionId }
      )
    }

    try {
      const res = await fetch(`${API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Ha ocurrido un error')
        setStatus('error')
        return
      }

      // Salida fuera de la SPA: se usa window.location y no navigate()
      // porque checkoutUrl apunta al dominio de Stripe.
      window.location.href = data.checkoutUrl

    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.')
      setStatus('error')
    }
  }

  // Sin carrito no hay nada que pagar: se muestra el aviso en lugar del formulario.
  if (!cart || cart.items.length === 0) {
    return (
      <main className="checkout">
        <div className="checkout__wrap">
          <p className="checkout__empty">Tu carrito está vacío.</p>
          <button className="checkout__btn-back" onClick={() => navigate('/catalogo')}>
            Ver catálogo
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout">
      <div className="checkout__wrap">

        <div className="checkout__header">
          <button className="checkout__back" onClick={() => navigate('/carrito')}>
            ← Volver al carrito
          </button>
          <h1 className="checkout__title">Finalizar pedido</h1>
        </div>

        <div className="checkout__layout">

          <div className="checkout__form-wrap">
            <h2 className="checkout__section-title">Datos de envío</h2>

            {status === 'error' && (
              <div className="checkout__error">{errorMsg}</div>
            )}

            <div className="checkout__form">

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  className="checkout__input"
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="shipping_name">
                  Nombre completo
                </label>
                <input
                  className="checkout__input"
                  type="text"
                  id="shipping_name"
                  name="shipping_name"
                  value={form.shipping_name}
                  onChange={handleChange}
                  placeholder="Nombre Apellido"
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="shipping_phone">
                  Teléfono <span className="checkout__optional">(opcional)</span>
                </label>
                <input
                  className="checkout__input"
                  type="tel"
                  id="shipping_phone"
                  name="shipping_phone"
                  value={form.shipping_phone}
                  onChange={handleChange}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="shipping_address_line1">
                  Dirección
                </label>
                <input
                  className="checkout__input"
                  type="text"
                  id="shipping_address_line1"
                  name="shipping_address_line1"
                  value={form.shipping_address_line1}
                  onChange={handleChange}
                  placeholder="Calle Mayor 1"
                  required
                />
              </div>

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="shipping_address_line2">
                  Dirección adicional <span className="checkout__optional">(opcional)</span>
                </label>
                <input
                  className="checkout__input"
                  type="text"
                  id="shipping_address_line2"
                  name="shipping_address_line2"
                  value={form.shipping_address_line2}
                  onChange={handleChange}
                  placeholder="Piso 2A, escalera B..."
                />
              </div>

              <div className="checkout__row">
                <div className="checkout__field">
                  <label className="checkout__label" htmlFor="shipping_city">
                    Ciudad
                  </label>
                  <input
                    className="checkout__input"
                    type="text"
                    id="shipping_city"
                    name="shipping_city"
                    value={form.shipping_city}
                    onChange={handleChange}
                    placeholder="Madrid"
                    required
                  />
                </div>

                <div className="checkout__field">
                  <label className="checkout__label" htmlFor="shipping_postcode">
                    Código postal
                  </label>
                  <input
                    className="checkout__input"
                    type="text"
                    id="shipping_postcode"
                    name="shipping_postcode"
                    value={form.shipping_postcode}
                    onChange={handleChange}
                    placeholder="28001"
                    required
                  />
                </div>
              </div>

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="shipping_country">
                  País
                </label>
                <select
                  className="checkout__input checkout__select"
                  id="shipping_country"
                  name="shipping_country"
                  value={form.shipping_country}
                  onChange={handleChange}
                >
                  <option value="ES">España</option>
                  <option value="PT">Portugal</option>
                  <option value="FR">Francia</option>
                  <option value="DE">Alemania</option>
                  <option value="IT">Italia</option>
                  <option value="GB">Reino Unido</option>
                </select>
              </div>

              <div className="checkout__field">
                <label className="checkout__label" htmlFor="notes">
                  Notas <span className="checkout__optional">(opcional)</span>
                </label>
                <textarea
                  className="checkout__input checkout__textarea"
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Instrucciones especiales para la entrega..."
                  rows={3}
                />
              </div>

            </div>
          </div>

          <div className="checkout__summary">
            <h2 className="checkout__section-title">Resumen</h2>

            <div className="checkout__summary-items">
              {cart.items.map(item => (
                <div key={item.id} className="checkout__summary-item">
                  <span className="checkout__summary-name">
                    {item.product.name}
                    <span className="checkout__summary-qty"> × {item.qty}</span>
                  </span>
                  <span className="checkout__summary-price">{item.line_total}€</span>
                </div>
              ))}
            </div>

            <div className="checkout__summary-total">
              <span>Total</span>
              <span className="checkout__total">{cart.total}€</span>
            </div>

            <button
              className="checkout__submit"
              onClick={handleSubmit}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Procesando...' : 'Pagar con Stripe →'}
            </button>

            <p className="checkout__stripe-note">
              Serás redirigido a Stripe para completar el pago de forma segura.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}

export default Checkout