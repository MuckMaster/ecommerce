import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { API_URL } from '../config.js'   // ajusta los ../ según la profundidad de cada archivo
const AuthContext = createContext(null)

// Hook de acceso a la sesión (usuario, tokens y apiFetch).
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  // El accessToken vive solo en memoria a propósito: si se guardara en
  // localStorage quedaría expuesto a XSS. Se recupera al arrancar con
  // la cookie httpOnly del refresh token (ver restoreSession más abajo).
  const [accessToken, setAccessToken] = useState(null)

  // Marca que el intento de restaurar la sesión ya ha terminado.
  // Las pantallas protegidas lo usan para no redirigir a "no autorizado"
  // mientras todavía se está comprobando el refresh token.
  const [ready, setReady] = useState(false)

  // Promesa del refresh que está en marcha, o null si no hay ninguno.
  // Con la rotación, cada refresh gasta la llave: si se lanzaran dos a la vez,
  // el segundo llegaría con la llave ya gastada, recibiría 401 y cerraría la sesión.
  // Pasa de verdad: StrictMode ejecuta dos veces el useEffect en desarrollo, y varias
  // llamadas de apiFetch pueden recibir 401 a la vez. Es un useRef y no un useState
  // porque cambiarlo no tiene que volver a pintar nada.
  const refreshPromiseRef = useRef(null)

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
    // credentials: 'include' para que el navegador guarde la cookie del refresh token
    // también si la API está en otro origen (modo CORS_ORIGINS). En el mismo origen no cambia nada.
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
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
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')

    setUser(data.user)
    setAccessToken(data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  // Borra la sesión solo en el navegador (estado y localStorage), sin llamar a la API.
  // La usan logout() y refresh(): cuando el refresh falla, la sesión ya no vale en el servidor
  // y llamar a /logout solo serviría para borrar una cookie que quizá otra pestaña acaba de renovar.
  // Solo usa setters de useState (que nunca cambian) y localStorage, por eso puede usarse
  // dentro del useCallback de refresh sin ponerla en sus dependencias.
  function clearLocalSession() {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('user')
  }

  // Cierra sesión avisando al backend para que borre la sesión y la cookie.
  // No hace falta body ni cabeceras: la cookie la envía el navegador solo.
  // La limpieza va en el finally: aunque la petición falle (red caída o un 500,
  // que fetch no trata como error), la sesión queda cerrada en el navegador.
  async function logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch {
      // Se ignora a propósito: si la API no responde, el usuario tiene que quedar deslogueado igual
    } finally {
      clearLocalSession()
    }
  }

  // Hace la petición a /refresh: el navegador envía la cookie y la API devuelve
  // un accessToken y una cookie nueva (rotación). Devuelve el accessToken o null.
  // No llamarla directamente: usar refresh(), que evita dos peticiones a la vez.
  async function requestNewAccessToken() {
    // JavaScript no puede ver la cookie httpOnly, así que se usa el usuario guardado
    // como pista: si no hay, no hay sesión que renovar y no se llama a la API.
    // Así un visitante anónimo no provoca un 401 en cada visita.
    if (!localStorage.getItem('user')) return null

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      // Solo un 401 significa que la sesión ya no vale (cookie caducada, borrada o ya gastada):
      // entonces se limpia para no seguir mostrando un usuario que no está autenticado.
      if (res.status === 401) {
        clearLocalSession()
        return null
      }

      // Un 5xx es un fallo del servidor, no de la sesión: la cookie puede seguir siendo válida.
      // Se devuelve null sin borrar nada; el próximo refresh lo volverá a intentar.
      if (!res.ok) {
        return null
      }

      const data = await res.json()
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      // Error de red (sin conexión, API parada): tampoco dice nada de la sesión.
      // No se desloguea a nadie por perder la conexión un segundo.
      return null
    }
  }

  // Pide un accessToken nuevo, pero nunca lanza dos peticiones a la vez:
  // si ya hay una en marcha, devuelve esa misma promesa y todos esperan el mismo resultado.
  // Devuelve una promesa con el accessToken, o con null si la sesión ya no vale.
  const refresh = useCallback(() => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    // Al terminar (bien o mal) se vacía la referencia, para que el próximo refresh haga otra petición
    refreshPromiseRef.current = requestNewAccessToken().finally(() => {
      refreshPromiseRef.current = null
    })

    return refreshPromiseRef.current
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
            // Limpieza de la versión anterior, que guardaba el refresh token en localStorage,
            // donde cualquier script podía leerlo. Ahora va en una cookie httpOnly.
            localStorage.removeItem('refreshToken')

            // refresh() nunca lanza error (devuelve null si falla) y ya limpia la sesión
            // si no vale. Con StrictMode este efecto corre dos veces, pero las dos llamadas
            // comparten la misma petición gracias a refreshPromiseRef.
            await refresh()
            setReady(true)
        }
        restoreSession()
    }, [refresh])

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