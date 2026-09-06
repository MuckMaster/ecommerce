import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Contact.css'
import { API_URL } from '../../config.js'   // ajusta los ../ según la profundidad de cada archivo

// Formulario de contacto. Envía el mensaje al backend, que es quien
// se encarga de hacerlo llegar por correo.
function Contact() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    })

    // null | 'loading' | 'success' | 'error' — controla el mensaje de aviso
    // y el texto del botón de envío.
    const [status, setStatus] = useState(null)

    function handleChange(e) {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setStatus('loading')

        try {
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    name: form.name,
                    email:form.email,
                    // undefined se omite al serializar a JSON: si el teléfono
                    // está vacío, el campo no llega al backend en vez de ir como ''.
                    phone: form.phone || undefined,
                    message: form.message
                })
            })
            if (!response.ok) {
                throw new Error('Error en el servidor')
            }

            // Se vacía el formulario solo si el envío ha ido bien: si falla,
            // el usuario conserva lo escrito para poder reintentarlo.
            setStatus('success')
            setForm({name: '', email: '', phone: '', message:''})
        } catch (err) {
            console.error('Error al enviar el formulario:', err)
            setStatus('error')
        }
    }

    return (
        <main className="contact">
            <div className="contact__wrap">
                <div className="contact__header">
                    <button
                        className="contact__back"
                        onClick={() => navigate(-1)}
                        aria-label="Volver atrás"
                    >
                        ← Volver
                    </button>
                    <h1 className="contact__title">Contacto</h1>
                    <p className="contact__subtitle">
                        ¿Tienes alguna pregunta? Escríbenos y te responderemos lo antes posible.
                    </p>
                </div>

                <div className="contact__form-wrap">
                    {status === 'success' && (
                        <div className="contact__feedback contact__feedback--success">
                            Mesaje enviado correctamente. Nos pondremos en contacto contigo pronto.
                        </div>
                    )}

                    {status === 'error' &&(
                        <div className="contact__feedback contact__feedback--error">
                            Ha ocurrido un error. Por favor, inténtalo de nuevo.
                        </div>
                    )}

                    <div className="contact__form">
                        <div className="contact__field">
                            <label className="contact__label" htmlFor="name">Nombre</label>
                            <input
                                className="contact__input"
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                        <div className="contact__field">
                            <label className="contact__label" htmlFor="email">Correo electrónico</label>
                            <input
                                className="contact__input"
                                type="email"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                        <div className="contact__field">
                            <label className="contact__label" htmlFor="phone">Teléfono<span className="contact__optional">(opcional)</span></label>
                            <input
                                className="contact__input"
                                type="tel"
                                id="phone"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+34 600 000 000"
                            />
                        </div>
                        <div className="contact__field">
                            <label className="contact__label" htmlFor="message">Mensaje</label>
                            <textarea
                                className="contact__textarea"
                                id="message"
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Escribe tu mensaje aquí..."
                                rows={6}
                                required
                            />
                        </div>

                        <button
                            className="contact__submit"
                            onClick={handleSubmit}
                            type="button"
                        >
                            {status === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Contact