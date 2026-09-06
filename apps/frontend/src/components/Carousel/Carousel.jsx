import { useState, useEffect, useCallback } from 'react'
import './Carousel.css'

// Carrusel de desplazamiento continuo. La animación la hace el CSS
// sobre .carousel__track; aquí solo se prepara la lista de imágenes.
function Carousel({ images }) {
    // Se duplica el juego de imágenes para que, al terminar la animación
    // y saltar de vuelta al inicio, el corte no se note y el bucle
    // parezca infinito. La segunda copia es puramente decorativa:
    // va sin alt y con aria-hidden para no repetirla en lectores de pantalla.
    const loopedImages = [...images, ...images]

    return (
        <section className="carousel" aria-label="Carrusel de imágenes">
            <div className="carousel__track">
                {loopedImages.map((src, i) => (
                    <div key={i} className="carousel__slide">
                        <img 
                        src={src}
                         alt={i > images.lenght ? `Imagen ${i+1} NivetBags` : ''}
                         aria-hidden={i >= images.lenght}
                         />
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Carousel