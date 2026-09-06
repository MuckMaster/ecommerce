import { useNavigate } from 'react-router-dom'
import './Navbar.css'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { API_URL } from '../../config'



// Barra de navegación fija, presente en todas las páginas.
// Se oculta al bajar, muestra el contador del carrito y genera
// el desplegable de categorías a partir de la API.
function Navbar({ onAuthOpen }) {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [hidden, setHidden] = useState(false)      // navbar oculta al hacer scroll hacia abajo
    const [menuOpen, setMenuOpen] = useState(false)  // menú hamburguesa (móvil)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    // En ratón el desplegable se abre con :hover desde el CSS; en táctil no existe
    // el hover, así que ahí hace falta abrirlo por clic (ver el onClick del li.dropdown).
    const isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    // Guarda la posición anterior del scroll. Es un ref y no un estado
    // porque cambia en cada scroll y no debe provocar re-render.
    const lastScroll = useRef(0)

    const { itemCount } = useCart()

    // Categorías para generar los enlaces del dropdown automáticamente
    const [categories, setCategories] = useState([])

    // Oculta la navbar al bajar y la devuelve al subir. El margen de 80px evita
    // que parpadee con los micro-scrolls de la parte alta de la página.
    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY

            if (currentScroll > lastScroll.current && currentScroll > 80) {
                // bajando
                setHidden(true)
            } else {
                // subiendo
                setHidden(false)
            }

            lastScroll.current = currentScroll
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    
    // Cierra el desplegable al pulsar en cualquier sitio fuera de él.
    // closest('.dropdown') distingue si el clic ocurrió dentro del propio menú.
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dropdown')) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    // Bloquea el scroll del fondo mientras el menú móvil está abierto.
    // La limpieza lo restaura también si el componente se desmonta abierto.
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    // Categorías del desplegable: se piden una sola vez al montar,
    // así al añadir una categoría nueva en el panel aparece sola en el menú.
     useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch(`${API_URL}/api/categories`)
                if (res.ok) setCategories(await res.json())
            } catch (err) {
                console.error('Error cargando categorías:', err)
            }
        }
        fetchCategories()
    }, [])

    return (
        <header className={`navbar ${hidden ? 'navbar-hidden' : ''}`}>
            
            <button
                className="navbar__logo"
                onClick={() => {
                    navigate('/')
                    setMenuOpen(false)}}
                aria-label="Ir al inicio"
            >
                <img src="/images/logo/logo_rivet_sinfondo.png" alt="Rivet Bags" className="navbar__logo-img" />
            </button>

            

            <nav className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>

                <button
                    className="navbar__item__2"
                    onClick={() => navigate('/contacto')}
                >
                    Contacto
                </button>

                {/* Con sesión iniciada lleva a "Mi cuenta"; si no, abre el modal de acceso */}
                {user ? (
                    <button
                        className="navbar__item__2"
                        onClick={() => { navigate('/mi-cuenta'); setMenuOpen(false) }}
                    >
                        Mi cuenta
                    </button>
                ) : (
                    <button className="navbar__item__2" onClick={onAuthOpen}>
                        Iniciar Sesión
                    </button>
                )}

                {/* <button
                    className="navbar__link"
                    onClick={() => {
                        navigate('/catalogo')
                        setMenuOpen(false)
                    }}
                >
                    Catalogo
                </button> */}
                
                {/* Desplegable de catálogo. La clase 'active' solo se usa en táctil:
                    en dispositivos con ratón lo abre el :hover del CSS.
                    stopPropagation impide que este mismo clic lo cierre
                    a través del listener de "clic fuera". */}
                <li
                    className={`navbar__item dropdown ${dropdownOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!isHoverDevice) {setDropdownOpen(!dropdownOpen)}
                    }}
                >
                    Catálogo
                    <ul className="dropdown__menu">
                                                <li 
                            className="navbar__link" 
                            onClick={() => {
                                navigate('/catalogo') 
                                setDropdownOpen(false)}}
                        >
                            Catálogo completo
                        </li>
                        {/* Un enlace por cada categoría, generado automáticamente.
                            Filtra por el slug de la categoría (?cat=slug). */}
                        {categories.map(cat => (
                            <li
                                key={cat.id}
                                className="navbar__link"
                                onClick={() => {
                                    navigate(`/catalogo?cat=${cat.slug}`)
                                    setDropdownOpen(false)
                                }}
                            >
                                Bolsos de {cat.name}
                            </li>
                        ))}
                    </ul>
                </li>
                <button
                className="navbar__item__2"
                onClick={() => { navigate('/carrito'); setMenuOpen(false) }}
                >
                    {/* El contador solo se pinta si hay algo en el carrito */}
                    Carrito {itemCount > 0 && <span className="navbar__badge">{itemCount}</span>}
                </button>
            </nav>
            {/* Menu hamburguesa para movil */}
            <button
                className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
        </header>
    )
}

export default Navbar