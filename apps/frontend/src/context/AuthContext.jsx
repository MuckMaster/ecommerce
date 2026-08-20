import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { API_URL } from '../config.js'   // ajusta los ../ según la profundidad de cada archivo
const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)

  const [ready, setReady] = useState(false)

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  async function register(name, email, password) {
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