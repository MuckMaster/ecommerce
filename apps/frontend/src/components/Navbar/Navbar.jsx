import './Navbar.css'

function Navbar({ onNavigate, cartCount }) {
    return (
        <header className="navbar" role="banner">
            <button
                className="navbar__logo"
                onClick={() => onNavigate('home')}
                aria-label="Ir al inicio"
            >
                Nivet Bags
            </button>

            <nav classname="navbar__links" aria-label="Navegación principal">
                <button
                    className="navbar__link"
                    onClick={() => onNavigate('catalogue')}
                >
                    Catalogo
                </button>
            </nav>
        </header>
    )
}

export default Navbar