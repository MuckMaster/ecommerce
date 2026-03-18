import { useState } from 'react'
import './Accordion.css'

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