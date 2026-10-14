import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import Accordion from '../../components/Accordion/Accordion'
import { useCart } from '../../context/CartContext'
import { API_URL, imageUrl, formatPrice, STORE_EMAIL } from '../../config'
import './ProductDetail.css'

// Ficha de producto: galería con swatches de color, precio, descripción,
// añadir al carrito y acordeones de información.
function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados del carrusel y swatches
  const [currentImg, setCurrentImg] = useState(0)
  const [direction, setDirection] = useState('next')  // sentido de la animación
  const [animating, setAnimating] = useState(false)   // bloquea clics durante la transición
  const [selectedColor, setSelectedColor] = useState(null)
  // Título del acordeón que debería estar abierto, o null (ver toggleAccordion).
  const [openAccordion, setOpenAccordion] = useState(null)

  // Coordenadas del inicio del gesto táctil, en refs porque cambian
  // durante el swipe y no deben provocar re-render.
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  // Referencia al panel de info; los acordeones la usan para ajustar el scroll.
  const infoRef = useRef(null)

  // Recarga con [id] para que al navegar entre productos se pida el nuevo.
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`)
        if (!res.ok) {
          // Producto inexistente (o borrado): se devuelve al catálogo
          // en lugar de mostrar un error a un cliente.
          if (res.status === 404) {
            navigate('/catalogo')
            return
          }
          throw new Error('Error al cargar el producto')
        }
        const data = await res.json()
        setProduct(data)
        // Inicializamos el color seleccionado con la primera variante
        if (data.product_variants?.length > 0) {
          setSelectedColor(data.product_variants[0])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) return <div className="detail__loading">Cargando producto...</div>
  if (error) return <div className="detail__error">{error}</div>
  if (!product) return null

  // Imágenes activas — si el color seleccionado tiene imágenes propias usamos esas,
  // si no, las imágenes generales del producto.
  // Filtramos por variant_id si hay color seleccionado con imágenes.
  const variantImages = selectedColor
    ? product.product_images.filter(img => img.variant_id === selectedColor.id)
    : []

  const generalImages = product.product_images.filter(img => img.variant_id === null)

  // Usamos las imágenes de la variante si existen, si no las generales
  const activeImages = (variantImages.length > 0 ? variantImages : generalImages)
    .sort((a, b) => a.sort_order - b.sort_order) // ordenamos por sort_order

  // Cambia de imagen. El flag `animating` descarta las pulsaciones que llegan
  // mientras hay una transición en curso, y el setTimeout deja que React
  // aplique primero la nueva dirección antes de cambiar el índice
  // (si no, la animación saldría hacia el lado contrario).
  function changeImg(newIndex, dir) {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrentImg(newIndex)
      setAnimating(false)
    }, 10)
  }

  // El módulo hace la galería circular: de la última se pasa a la primera.
  // En prevImg se suma length antes del % para no obtener un índice negativo.
  const prevImg = () => changeImg(
    (currentImg - 1 + activeImages.length) % activeImages.length, 'prev'
  )
  const nextImg = () => changeImg(
    (currentImg + 1) % activeImages.length, 'next'
  )

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  // Swipe en móvil. Solo se considera swipe si el movimiento horizontal supera
  // al vertical (así no se cambia de foto mientras se hace scroll) y si recorre
  // más de 50px, para descartar toques accidentales.
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diffX = touchStartX.current - e.changedTouches[0].clientX
    const diffY = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) nextImg()
      if (diffX < -50) prevImg()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // Al cambiar de color se vuelve a la primera imagen: el nuevo juego de fotos
  // puede tener menos elementos y el índice actual quedaría fuera de rango.
  function handleSwatchClick(variant) {
    setSelectedColor(variant)
    setCurrentImg(0)
    setDirection('next')
  }

  // Lleva la cuenta de qué acordeón debería estar abierto (uno a la vez).
  // OJO: el componente Accordion actual no lee las props isOpen/onToggle,
  // gestiona su apertura por su cuenta, así que este estado hoy no le afecta.
  function toggleAccordion(title) {
    setOpenAccordion(prev => prev === title ? null : title)
  }

  return (
    <main className="detail">
      <div className="detail__wrap">

        <div
          className="detail__gallery"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="detail__gallery-main">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.img
                key={currentImg}
                className="detail__img"
                src={activeImages[currentImg] ? imageUrl(activeImages[currentImg].url) : ''}
                alt={activeImages[currentImg]?.alt_text || product.name}
                loading="eager"
                custom={direction}
                variants={{
                  enter: (dir) => ({ x: dir === 'next' ? 60 : -60, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir) => ({ x: dir === 'next' ? -60 : 60, opacity: 0 })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </AnimatePresence>

            {/* Con una sola imagen no se muestran las flechas */}
            {activeImages.length > 1 && (
              <>
                <button className="detail__gallery-btn detail__gallery-btn--prev" onClick={prevImg} aria-label="Foto anterior">&#8592;</button>
                <button className="detail__gallery-btn detail__gallery-btn--next" onClick={nextImg} aria-label="Siguiente foto">&#8594;</button>
              </>
            )}

            <div className="detail__gallery-dots">
              {activeImages.map((_, i) => (
                <button
                  key={i}
                  className={`detail__gallery-dot ${i === currentImg ? 'detail__gallery-dot--active' : ''}`}
                  onClick={() => setCurrentImg(i)}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="detail__info" ref={infoRef}>
          <button className="detail__back" onClick={() => navigate(-1)} aria-label="Volver atrás">
            ← Volver
          </button>

          <nav className="detail__breadcrumb" aria-label="Ruta de navegación">
            <span onClick={() => navigate('/')}>Inicio</span>
            <span className="detail__breadcrumb-sep">›</span>
            <span onClick={() => navigate('/catalogo')}>Colección</span>
            <span className="detail__breadcrumb-sep">›</span>
            <span>{product.name}</span>
          </nav>

          <h1 className="detail__name">{product.name}</h1>

          {/* Categorías desde product_categories */}
          {product.product_categories?.length > 0 && (
            <div className="detail__categories">
              {product.product_categories.map((cat, i) => (
                <span key={i}>
                  {cat.category?.name || cat.name}
                  {i < product.product_categories.length - 1 && (
                    <span className="detail__cat-sep"> | </span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="detail__price">{formatPrice(product.price)}</div>

          {/* Swatches desde product_variants */}
          {product.product_variants?.length > 0 && selectedColor && (
            <>
              <p className="detail__color-label">
                Color: <span>{selectedColor.name}</span>
              </p>
              <div className="detail__swatches">
                {product.product_variants.map(variant => (
                  <button
                    key={variant.id}
                    className={`detail__swatch ${selectedColor.id === variant.id ? 'detail__swatch--active' : ''}`}
                    style={{ background: variant.css }}
                    onClick={() => handleSwatchClick(variant)}
                    aria-label={`Color ${variant.name}`}
                    aria-pressed={selectedColor.id === variant.id}
                  />
                ))}
              </div>
            </>
          )}

          {/* Descripción */}
          {product.short_description && (
            <p className="detail__desc">{product.short_description}</p>
          )}
          {product.description && (
            <p className="detail__desc">{product.description}</p>
          )}

          {/* Botón añadir al carrito — pasa el variant_id si hay color seleccionado */}
          <button
            className="detail__btn-cart"
            onClick={() => addItem(product.id, 1, selectedColor?.id || null)}
          >
            Añadir al carrito
          </button>

          <div className="detail__accordions">
              {(product.material || product.care) && (
              <Accordion
                title="Composición y cuidados"
                isOpen={openAccordion === 'Composición y cuidados'}
                onToggle={() => toggleAccordion('Composición y cuidados')}
                containerRef={infoRef}
              >
                {product.material && (
                  <p><strong>Material: </strong>{product.material}</p>
                )}
                {product.care && (
                  <p><strong>Cuidados: </strong>{product.care}</p>
                )}
              </Accordion>
              )}
            <Accordion
              title="Envios"
              isOpen={openAccordion === 'Envios'}
              onToggle={() => toggleAccordion('Envios')}
              containerRef={infoRef}
            >
              El envío tarda 3-4 días laborables.<br />
              Coste de envío: 15€. Envío gratuito para pedidos superiores a 150€.
            </Accordion>
            <Accordion
              title="Devoluciones"
              isOpen={openAccordion === 'Devoluciones'}
              onToggle={() => toggleAccordion('Devoluciones')}
              containerRef={infoRef}
            >
              Aceptamos devoluciones en los 14 días siguientes a la recepción.<br />
              El artículo debe estar en perfecto estado y sin usar.
            </Accordion>
            <Accordion
              title="Contacto"
              isOpen={openAccordion === 'Contacto'}
              onToggle={() => toggleAccordion('Contacto')}
              containerRef={infoRef}
            >
              ¿Tienes alguna duda? Escríbenos a {STORE_EMAIL}
            </Accordion>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProductDetail