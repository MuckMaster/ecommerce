import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { API_URL } from '../config.js'

const CartContext = createContext(null)

export function useCart() {
    return useContext(CartContext)
}

function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() *16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })    
}

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

    const [cart, setCart] = useState(null)

    const [loading, setLoading] =useState(false)

    const sessionId = getSessionId()

    const cartHeaders = {
        'Content-Type': 'application/json',
        'X-Session-id': sessionId,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }

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

    useEffect(() => {
        fetchCart()
    }, [fetchCart])

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
            console.log('Respuesta del backend:', data)
            if (res.ok) await fetchCart()
        } catch (err) {
            console.error ( 'Error al añadir al carrito:', err )}
    }


    async function updateItem(itemId, qty) {
        try {
            const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
                method: 'PUT',
                headers: cartHeaders,
                body: JSON.stringify({ qty })
            })
            const data = await res.json()
            console.log ('updateItem respuesta:', data)
            if (res.ok) await fetchCart()
        } catch (err){
            console.error('Error al actualizar el carrito:', err)
        }
    }

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