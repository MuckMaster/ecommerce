import { useState } from 'react'
import Accordion from '../../components/Accordion/Accordion'
import './ProductDetail.css'

function ProductDetail({ product, onNavigate }) {
    const [selectedColor, setSelectedColor] = useState(product.swatches[0])

    return (
        <main className="detail">
            <div className="detail__wrap">
                <div className="detail__gallery">
                    {product.images.map((src, i) => (
                        <div key={i} className="detail__img-wrap">
                            <img 
                                className="detail__img"
                                src={src}
                                alt={`${product.name} - foto ${i+1}`}
                                loading={i === 0 ? 'eager' : 'lazy'}
                            />
                        </div>
                    ))}
                </div>

                <div className="detail__info">
                    <nav className="detail__breadcrumb" aria-label="Ruta de navegación">
                        <span onClick={() => onNavigate('home')}>Inicio</span>
                        <span className="detail__breadcrumb-sep">›</span>
                        <span onClick={() => onNavigate('catalogue')}>Colección</span>
                        <span className="detail__breadcrumb-sep">›</span>
                        <span>{product.name}</span>
                    </nav>

                    <h1 className="detail__name">{product.name}</h1>
                    <div className="detail__categories">
                        <span>{product.category}</span>
                        <span className="detail__cat-sep">|</span>
                        <span>Artesanal</span>
                    </div>

                    <div className="detail__price">{product.price}€</div>

                    <p className="detail__color-label">
                        Color: <span>{selectedColor.name}</span>
                    </p>

                    <div className="detail__swatches">
                        {product.swatches.map(swatch => (
                            <button
                                key={swatch.name}
                                className={`detail__swatch ${selectedColor.name === swatch.name ? 'detail__swatch--active' : ''}`}
                                style={{ background: swatch.css }}
                                onClick={() => setSelectedColor(swatch)}
                                aria-label={`Color ${swatch.name}`}
                                aria-pressed={selectedColor.name === swatch.name}
                            />
                        ))}
                    </div>

                    <p className="detail__desc">{product.description}</p>
                    <button className="detail__btn-cart">
                        Añadir al carrito
                    </button>

                    <div className="detail__accordions">
                        <Accordion title="Envios">
                            El envío tarda 3-4 días laborables.<br />
                            Coste de envío: 15€. Envío gratuito para pedidos superiores a 150€.
                        </Accordion>
                        <Accordion title="Devoluciones">
                            Aceptamos devoluciones en los 14 días siguientes a la recepción.<br />
                            El artículo debe estar en perfecto estado y sin usar.
                        </Accordion>
                        <Accordion title="Contacto">
                            ¿Tienes alguna duda? Escríbenos a ejemplo@email.com o síguenos en Instagram @ejemplo.
                        </Accordion>
                    </div>

                </div>
            </div>
            
        </main>
    )
}

export default ProductDetail