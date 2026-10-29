// AdminLayout.jsx — Layout compartido por todas las páginas del panel.
// Incluye la barra lateral de navegación del admin.
import { Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AdminLayout.css'

function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  // Links del menú lateral
  const navLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/productos', label: 'Productos' },
    { path: '/admin/categorias', label: 'Categorías' },
    { path: '/admin/pedidos', label: 'Pedidos' },
  ]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-layout">

      {/* Barra lateral */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand" onClick={() => navigate('/admin')}>
          Panel Admin
        </div>

        <nav className="admin-sidebar__nav">
          {navLinks.map(link => (
            <button
              key={link.path}
              className={`admin-sidebar__link ${location.pathname === link.path ? 'admin-sidebar__link--active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button className="admin-sidebar__link" onClick={() => navigate('/')}>
            ← Ver tienda
          </button>
          <button className="admin-sidebar__logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="admin-main">
        {/* Las páginas del admin son lazy: la primera vez que se entra en
            cada una se descarga su chunk. Este Suspense solo envuelve el
            contenido, así que mientras carga se ve el fallback aquí dentro
            y la barra lateral se mantiene. Sin él, la espera subiría al
            Suspense de App.jsx y se taparía el panel entero. */}
        <Suspense fallback={<p>Cargando...</p>}>
          {children}
        </Suspense>
      </main>

    </div>
  )
}

export default AdminLayout