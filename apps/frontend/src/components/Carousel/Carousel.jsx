import { useState, useEffect, useCallback } from 'react'
import './Carousel.css'

function Carousel({ images }) {
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