import { useState } from 'react'
import './Accordion.css'

// Bloque plegable reutilizable (composición, envíos, devoluciones...).
// Gestiona su propio estado de apertura: cada acordeón es independiente.
function Accordion({ title, children }) {
    const [isOpen, setIsOpen] = useState(false)

    return(
        <div className="accordion">
            <button
            className="accordion__trigger"
            onClick={() => setIsOpen(prev => !prev)}
            aria-expanded={isOpen}
            >
                <span>{title}</span>
                <span
                className={`accordion__icon ${isOpen ? 'accordion__icon--open' : ''}`}
                aria-hidden="true"
                >
                    +
                </span>
            </button>

            {/* El contenido siempre está en el DOM y se abre y cierra por CSS:
                así la transición de altura puede animarse. aria-hidden lo
                oculta a los lectores de pantalla mientras está plegado. */}
            <div
            className={`accordion__body ${isOpen ? 'accordion__body--open' : ''}`}
            aria-hidden={!isOpen}
            >
                <div className="accordion__content">
                    {children}
                </div>
            </div>

        </div>
    )
}

export default Accordion