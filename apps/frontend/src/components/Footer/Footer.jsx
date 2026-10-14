import './Footer.css'
import { STORE_NAME } from '../../config'

// Pie de página fijo en todas las rutas. Los enlaces legales todavía son
// texto sin navegación: aún no existen esas páginas.
function Footer() {
  // El año se calcula en cada visita para que el copyright no se quede anticuado
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__brand">{STORE_NAME}</div>
      <div className="footer__links">
        <span>Aviso legal</span>
        <span>Política de privacidad</span>
        <span>Contacto</span>
      </div>
      <div className="footer__copy">© {currentYear} {STORE_NAME}. Todos los derechos reservados.</div>
    </footer>
  )
}

export default Footer