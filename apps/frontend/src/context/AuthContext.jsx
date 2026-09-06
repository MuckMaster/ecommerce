import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { API_URL } from '../config.js'   // ajusta los ../ según la profundidad de cada archivo
const AuthContext = createContext(null)

// Hook de acceso a la sesión (usuario, tokens y apiFetch).
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  // El accessToken vive solo en memoria a propósito: si se guardara en
  // localStorage quedaría expuesto a XSS. Se recupera al arrancar con
  // el refreshToken (ver restoreSession más abajo).
  const [accessToken, setAccessToken] = useState(null)

  // Marca que el intento de restaurar la sesión ya ha terminado.
  // Las pantallas protegidas lo usan para no redirigir a "no autorizado"
  // mientras todavía se está comprobando el refreshToken.
  const [ready, setReady] = useState(false)

  // El usuario sí se persiste en localStorage para poder pintar la interfaz
  // (nombre, si es admin...) desde el primer render, sin esperar al refresh.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  async function register(name, email, password) {
    // Se manda el sessionId del carrito anónimo para que el backend
    // pueda traspasar ese carrito a la cuenta recién creada.
    const sessionId = localStorage.getItem('sessionId')
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId ? { 'X-Session-Id': sessionId } : {})
      },
      body: JSON.stringify({ name, email, password })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al registrarse')

    setUser(data.user)
    setAccessToken(data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('refreshToken', data.refreshToken)
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')

    setUser(data.user)
    setAccessToken(data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('refreshToken', data.refreshToken)
  }

  // Cierra sesión avisando al backend para que invalide el refreshToken.
  // El catch se ignora y la limpieza va en el finally: aunque la petición
  // falle, la sesión debe quedar cerrada en el navegador igualmente.
  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ refreshToken }),
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
    } catch { } finally {
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem('user')
      localStorage.removeItem('refreshToken')
    }
  }

  // Pide un accessToken nuevo a partir del refreshToken guardado.
  // Si el refreshToken ya no vale, cierra sesión para no dejar
  // al usuario en un estado a medias.
  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (!res.ok) { logout(); return null }

      const data = await res.json()
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      logout()
      return null
    }
  }, [])

  // Envoltorio de fetch para las rutas protegidas: añade el Bearer y,
  // si el backend responde 401 (token caducado), renueva el token
  // y repite la petición una sola vez de forma transparente.
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }

    let res = await fetch(`${API_URL}${url}`, { ...options, headers })

    if (res.status === 401) {
      const newToken = await refresh()
      if (newToken) {
        res = await fetch(`${API_URL}${url}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` }
        })
      }
    }

    return res
  }, [accessToken, refresh])

    // Al montar la app se intenta recuperar la sesión: como el accessToken
    // no se persiste, sin esto el usuario aparecería deslogueado en cada
    // recarga de página. Pase lo que pase, al final se marca ready = true.
    useEffect(() => {
        async function restoreSession() {
            const refreshToken = localStorage.getItem('refreshToken')
            if(!refreshToken) {
                setReady(true)
                return
            }

            try {
                const res = await fetch(`${API_URL}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                })

                // Refresh rechazado: se limpia la sesión guardada para no
                // seguir mostrando un usuario que ya no está autenticado.
                if(!res.ok) {
                    localStorage.removeItem('refreshToken')
                    localStorage.removeItem('user')
                    setUser(null)
                    return
                }

                const data = await res.json()
                setAccessToken(data.accessToken)
            } catch {
                localStorage.removeItem('refreshToken')
            } finally {
                setReady(true)
            }
        }
        restoreSession()
    }, [])

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      refresh,
      apiFetch,
      ready
    }}>
      {children}
    </AuthContext.Provider>
  )
}