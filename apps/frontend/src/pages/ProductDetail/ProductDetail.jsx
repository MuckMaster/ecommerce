import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Accordion from '../../components/Accordion/Accordion'
import './ProductDetail.css'
import { products } from '../../data/products'

function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()


    const product = products.find(p => p.id === parseInt(id))


    if (!product) {
        navigate('/catalogo')
        return null
    }

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
                        <span onClick={() => navigate('/')}>Inicio</span>
                        <span className="detail__breadcrumb-sep">›</span>
                        <span onClick={() => navigate('/catalogo')}>Colección</span>
                        <span className="detail__breadcrumb-sep">›</span>
                        <span>{product.name}</span>
                    </nav>

                    <h1 className="detail__name">{product.name}</h1>
                    <div className="detail__categories">
                        <span>{product.category}</span>
                        <span className="detail__cat-sep">|</span>
                        <span>{product.subcategory}</span>
                    </div>

                    <div className="detail__price">{product.price}€ en tienda sin IVA</div>

                    {/* Funcion de swatches de color */}

                    {product.swatches.length > 0 && (
                        <>
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
                        </>
                    )}

                   {product.description.map((item, i) =>(
                        <p className="detail__desc" key={i}>{item}</p>
                    ))}

                    {/* Botón desactivado temporalmente - funcionalidad de carrito pendiente
                    <button className="detail__btn-cart">
                        Añadir al carrito
                    </button>
                    */}

                    <div className="detail__accordions">
                        <Accordion title="Composición y cuidados">
                            <p><strong>Exterior: </strong>{product.composition.exterior}</p>
                            <p><strong>Interior: </strong>{product.composition.interior}</p>
                            
                            {product.care.length > 0 && (
                            <>
                            {product.care.map((item, i) => (
                                <p key={i}>· {item}</p>
                            ))}
                            </>
                            )}
                        </Accordion>
                        <Accordion title={"Detalles"}>
                            <p><strong>Medidas: </strong>{product.details.measures}</p>
                            <p><strong>Asas: </strong>{product.details.handles}</p>
                        </Accordion>
                        <Accordion title="Envios">
                            El envío tarda 3-4 días laborables.<br />
                            Coste de envío: 15€. Envío gratuito para pedidos superiores a 150€.
                        </Accordion>
                        <Accordion title="Devoluciones">
                            Aceptamos devoluciones en los 14 días siguientes a la recepción.<br />
                            El artículo debe estar en perfecto estado y sin usar.
                        </Accordion>
                        <Accordion title="Contacto">
                            ¿Tienes alguna duda? Escríbenos a comercial@rivetbag.com
                        </Accordion>
                        
                    </div>

                </div>
            </div>
            
        </main>
    )
}

export default ProductDetail