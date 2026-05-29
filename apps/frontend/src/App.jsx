import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar/Navbar'
import AuthModal from "./components/AuthModal/AuthModal";
import Footer from "./components/Footer/Footer";
import Home from './pages/Home/Home'
import Catalogue from './pages/Catalogue/Catalogue'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import Contact from './pages/Contact/Contact'
import Account from './pages/Account/Account'
import Cart from './pages/Cart/Cart'
import Checkout from './pages/Checkout/Checkout'
import OrderConfirmed from './pages/Checkout/OrderConfirmed'
import RequireAdmin from './components/RequireAdmin/RequireAdmin'
import AdminLayout from './layouts/AdminLayout/AdminLayout'
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard'
import AdminProducts from './pages/Admin/Products/AdminProducts'
import AdminProductForm from './pages/Admin/Products/AdminProductForm'
import AdminCategories from './pages/Admin/Categories/AdminCategories'
import AdminOrders from './pages/Admin/Orders/AdminOrders'
import AdminOrderDetail from './pages/Admin/Orders/AdminOrderDetail'

function App() {

    const [authOpen, setAuthOpen] = useState(false)

    return (
        <>
            <Navbar onAuthOpen={() => setAuthOpen(true)} />

            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
            />

            <Routes>
                <Route path="/" element={<Home />}/>
                <Route path="/catalogo" element={<Catalogue />}/>
                <Route path="/producto/:id" element={<ProductDetail />}/>
                <Route path="/contacto" element={<Contact />}/>
                <Route path="/mi-cuenta" element={<Account />}/>
                <Route path="/carrito" element={<Cart />}/>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedido/confirmado" element={<OrderConfirmed />} />
                <Route path="/admin" element={
                    <RequireAdmin>
                        <AdminLayout>
                        <AdminDashboard />
                        </AdminLayout>
                    </RequireAdmin>
                    } />
                <Route path="/admin/productos" element={
                    <RequireAdmin>
                        <AdminLayout>
                        <AdminProducts />
                        </AdminLayout>
                    </RequireAdmin>
                } />
                <Route path="/admin/productos/nuevo" element={
                        <RequireAdmin>
                            <AdminLayout>
                            <AdminProductForm />
                            </AdminLayout>
                        </RequireAdmin>
                } />
                <Route path="/admin/productos/:id" element={
                        <RequireAdmin>
                            <AdminLayout>
                            <AdminProductForm />
                            </AdminLayout>
                        </RequireAdmin>
                } />
                <Route path="/admin/categorias" element={
                    <RequireAdmin>
                        <AdminLayout>
                        <AdminCategories />
                        </AdminLayout>
                    </RequireAdmin>
                } />
                <Route path="/admin/pedidos" element={
                    <RequireAdmin>
                        <AdminLayout>
                        <AdminOrders />
                        </AdminLayout>
                    </RequireAdmin>
                } />
                <Route path="/admin/pedidos/:id" element={
                    <RequireAdmin>
                        <AdminLayout>
                        <AdminOrderDetail />
                        </AdminLayout>
                    </RequireAdmin>
                } />
            </Routes>

            <Footer />
        </>
    )
}

export default App