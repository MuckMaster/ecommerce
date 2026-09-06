import './Footer.css'

// Pie de página fijo en todas las rutas. Los enlaces legales todavía son
// texto sin navegación: aún no existen esas páginas.
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">Rivet Bags</div>
      <div className="footer__links">
        <span>Aviso legal</span>
        <span>Política de privacidad</span>
        <span>Contacto</span>
      </div>
      <div className="footer__copy">© 2026 Rivet Bags. Todos los derechos reservados.</div>
    </footer>
  )
}

export default Footer