import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { API_URL } from '../config.js'

const CartContext = createContext(null)

// Hook de acceso al carrito. Evita tener que importar CartContext
// y llamar a useContext en cada componente que lo consume.
export function useCart() {
    return useContext(CartContext)
}

// Genera un UUID v4 propio en lugar de usar crypto.randomUUID(),
// que no está disponible en contextos no seguros (http:// en pruebas locales).
function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() *16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })    
}

// Identificador persistente del visitante anónimo: permite que el backend
// asocie un carrito a alguien que todavía no ha iniciado sesión.
// Se crea la primera vez y se reutiliza en todas las visitas posteriores.
function getSessionId() {
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
        sessionId = generateSessionId()
        localStorage.setItem('sessionId', sessionId)
    }
    return sessionId
}

export function CartProvider({ children }) {
    const { accessToken, apiFetch } = useAuth()

    // Carrito completo tal cual lo devuelve el backend (items, totales...).
    // null = todavía no se ha cargado o está vacío.
    const [cart, setCart] = useState(null)

    const [loading, setLoading] =useState(false)

    const sessionId = getSessionId()

    // Cabeceras comunes a todas las peticiones del carrito.
    // Siempre viaja X-Session-id (carrito anónimo) y, si hay sesión iniciada,
    // se añade además el Bearer para que el backend pueda fusionar
    // el carrito anónimo con el del usuario.
    const cartHeaders = {
        'Content-Type': 'application/json',
        'X-Session-id': sessionId,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }

    // Recarga el carrito desde el backend. Depende de accessToken para que,
    // al iniciar o cerrar sesión, se vuelva a pedir el carrito correcto.
    const fetchCart = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/cart`, { headers: cartHeaders })
            if (res.ok) {
                const data = await res.json()
                setCart(data)
            }
        } catch (err) {
            console.error('Error al obtener el carrito: ', err)
        } finally {
            setLoading(false)
        }
    }, [accessToken])

    // Carga inicial del carrito y recarga automática cuando cambia la sesión.
    useEffect(() => {
        fetchCart()
    }, [fetchCart])

    // Añade un producto al carrito. Los ids se envían como String porque
    // el backend los espera en ese formato; variantId solo se incluye
    // si el producto tiene variante seleccionada.
    async function addItem(productId, qty = 1, variantId = null) {
        try {
            const res = await fetch(`${API_URL}/api/cart/items`, {
                method: 'POST',
                headers: cartHeaders,
                body: JSON.stringify({
                    productId: String(productId),
                    qty,
                    ...(variantId ? { variantId: String(variantId) } : {})
                })
            })
            const data = await res.json()
            // El carrito no se reconstruye con esta respuesta: se vuelve a pedir
            // entero con fetchCart() para no desincronizar totales ni stock.
            if (res.ok) await fetchCart()
        } catch (err) {
            console.error ( 'Error al añadir al carrito:', err )}
    }


    // Cambia la cantidad de una línea ya existente del carrito.
    async function updateItem(itemId, qty) {
        try {
            const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
                method: 'PUT',
                headers: cartHeaders,
                body: JSON.stringify({ qty })
            })
            const data = await res.json()
            // Igual que en addItem: se recarga el carrito completo en lugar de
            // aplicar la respuesta parcial sobre el estado local.
            if (res.ok) await fetchCart()
        } catch (err){
            console.error('Error al actualizar el carrito:', err)
        }
    }

    // Elimina una línea concreta del carrito.
    async function removeItem(itemId) {
        try {
            const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: cartHeaders
            })
            if (res.ok) await fetchCart()
        } catch (err) {
            console.error('Error al eliminar del carrito:', err)
        }
    }

    // Vacía el carrito entero. Aquí sí se pone el estado a null directamente
    // en vez de recargar: el resultado conocido es "carrito vacío".
    async function clearCart() {

        try {
            const res = await fetch(`${API_URL}/api/cart`,{
                method:'DELETE',
                headers: cartHeaders
            })
            if (res.ok) setCart(null)
        } catch (err) {
            console.error('Error al vaciar el carrito:', err)
        }
    }

    // Total de unidades (no de líneas) para el contador del icono del carrito.
    // Si aún no hay carrito cargado devuelve 0 en lugar de undefined.
    const itemCount = cart?.items?.reduce((acc, item) => acc + item.qty, 0) ?? 0

    return (
        <CartContext.Provider value={{
            cart,
            loading,
            itemCount,
            addItem,
            updateItem,
            removeItem,
            clearCart,
            fetchCart
        }}>
            {children}
        </CartContext.Provider>
    )
}