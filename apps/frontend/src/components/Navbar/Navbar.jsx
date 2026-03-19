import { useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
    const navigate = useNavigate()
    return (
        <header className="navbar" role="banner">
            
            <button
                className="navbar__logo"
                onClick={() => navigate('/')}
                aria-label="Ir al inicio"
            >
                Nivet Bags {/* <img src="/images/logo.png" alt="Nivet Bags" className="navbar__logo-img" /> Sustituir el texto con este codigo para el logo  */}
            </button>

            <nav className="navbar__links" aria-label="Navegación principal">
                <button
                    className="navbar__link"
                    onClick={() => navigate('/catalogo')}
                >
                    Catalogo
                </button>
            </nav>
        </header>
    )
}

export default Navbar