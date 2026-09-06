import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AuthModal.css'

// Modal único de acceso: alterna entre iniciar sesión y registrarse
// sin cambiar de ruta. Su apertura la controla App a través de isOpen.
function AuthModal({ isOpen, onClose }) {

    // 'login' | 'register' — determina qué campos se muestran
    // y a qué función del contexto se llama al enviar.
    const [mode, setMode] = useState('login')

    // Un único estado para los tres campos; handleChange los distingue
    // por el atributo name del input.
    const [form, setForm] = useState({ name: '', email: '', password: '' })

    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const { login, register } = useAuth()

    if(!isOpen) return null

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    // Envía el formulario según el modo activo. El modal solo se cierra
    // si la promesa no lanza; si falla, el error se muestra dentro.
    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (mode === 'login') {
                await login(form.email, form.password)
            } else {
                await register(form.name, form.email, form.password)
            } 
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Cambia entre login y registro limpiando el formulario y el error,
    // para no arrastrar datos ni mensajes del modo anterior.
    function handleSwitch() {
        setMode(prev => prev === 'login' ? 'register' : 'login')
        setForm({ name: '', email: '', password: '' })
        setError(null)
    }

    // Cierra al pulsar fuera de la caja. La comparación target/currentTarget
    // evita que un clic dentro del modal lo cierre por burbujeo.
    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) onClose()
    }

    return(

        <div className="auth-modal__overlay" onClick={handleOverlayClick}>
            <div className="auth-modal__box">

                <button
                    className="auth-modal__close"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    x
                </button>
                
                <h2 className="auth-modal__title">
                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </h2>

                {error && (
                    <p className="auth-modal__error">{error}</p>
                )}

                <div className="auth-modal__form">
                    {/* El campo Nombre solo existe en el registro */}
                    {mode === 'register' && (
                        <div className="auth-modal__field">
                            <label className="auth-modal__label" htmlFor="name">Nombre</label>
                            <input
                                className="auth-modal__input"
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                            />
                        </div>
                    )}

                    <div className="auth-modal__field">
                        <label className="auth-modal__label" htmlFor="email">Correo electrónico</label>
                        <input
                            className="auth-modal__input"
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="ejemplo@email.com"
                        />
                    </div>

                    <div className="auth-modal__field">
                        <label className="auth-modal__label" htmlFor="password">Contraseña</label>
                        <input
                            className="auth-modal__input"
                            type="password"
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="******"
                        />
                    </div>

                    <button
                        className="auth-modal__submit"
                        onClick={handleSubmit}
                    >
                        {loading
                            ? 'Cargando...'
                            : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
                        }
                    </button>

                </div>
                <p className="auth-modal__switch">
                    {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                    <button className="auth-modal__switch-btn" onClick={handleSwitch}>
                        {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                </p>

            </div>
        </div>

    )

}

export default AuthModal