// RequireAdmin.jsx — Protege las rutas del panel de administración.
// Si no hay usuario o no tiene rol ADMIN redirige al home.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RequireAdmin({ children }) {
  const navigate = useNavigate()
  const { user, ready } = useAuth()

  useEffect(() => {
    // Esperamos a que la sesión esté restaurada antes de comprobar el rol
    if (!ready) return

    if (!user || user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, ready])

  // Mientras se restaura la sesión no renderizamos nada
  if (!ready) return null

  // Si no es admin no renderizamos nada — el useEffect ya redirige
  if (!user || user.role !== 'ADMIN') return null

  return children
}

export default RequireAdmin