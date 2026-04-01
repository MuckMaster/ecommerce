import { useNavigate } from 'react-router-dom'
import './Navbar.css'
import { useEffect, useState, useRef } from 'react'


function Navbar() {
    const navigate = useNavigate()

    const [hidden, setHidden] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    const lastScroll = useRef(0)

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

    return (
        <header className={`navbar ${hidden ? 'navbar-hidden' : ''}`}>
            
            <button
                className="navbar__logo"
                onClick={() => {
                    navigate('/')
                    setMenuOpen(false)}}
                aria-label="Ir al inicio"
            >
                <img src="/images/logo/logo_rivet.png" alt="Rivet Bags" className="navbar__logo-img" />
            </button>

            <nav className={`navbar__links ${menuOpen ? 'active' : ''}`}>
                
                {/* <button
                    className="navbar__link"
                    onClick={() => {
                        navigate('/catalogo')
                        setMenuOpen(false)
                    }}
                >
                    Catalogo
                </button> */}
                
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
                        <li 
                            className="navbar__link" 
                            onClick={() => {
                                navigate('/catalogo?t=tela') 
                                setDropdownOpen(false)}}
                        >
                            Bolsos de tela
                        </li>
                        <li 
                            className="navbar__link" 
                            onClick={() => {
                                navigate('/catalogo?t=piel') 
                                setDropdownOpen(false)}}
                        >
                            Bolsos de piel
                        </li>
                    </ul>
                </li>
            </nav>
        </header>
    )
}

export default Navbar