import { useState, lazy, Suspense } from 'react'
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

// El panel de admin se carga bajo demanda: con import() dinámico Vite saca
// cada página (y su CSS) a un chunk aparte, y React.lazy solo lo descarga
// la primera vez que se pinta. Como RequireAdmin no pinta sus children si el
// usuario no es ADMIN, un visitante de la tienda nunca descarga este código.
// RequireAdmin se queda como import normal: es él quien decide si se pinta el admin.
const AdminLayout = lazy(() => import('./layouts/AdminLayout/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/Admin/Products/AdminProducts'))
const AdminProductForm = lazy(() => import('./pages/Admin/Products/AdminProductForm'))
const AdminCategories = lazy(() => import('./pages/Admin/Categories/AdminCategories'))
const AdminOrders = lazy(() => import('./pages/Admin/Orders/AdminOrders'))
const AdminOrderDetail = lazy(() => import('./pages/Admin/Orders/AdminOrderDetail'))

// Componente raíz: navbar y footer fijos en todas las páginas,
// y en medio el enrutado. Las rutas /admin/* van envueltas en
// RequireAdmin (control de acceso) + AdminLayout (chrome del panel).
function App() {

    // El modal de acceso vive aquí y no en la Navbar porque se abre desde
    // la propia navbar pero se monta por encima de toda la aplicación.
    const [authOpen, setAuthOpen] = useState(false)

    return (
        <>
            <Navbar onAuthOpen={() => setAuthOpen(true)} />

            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
            />

            {/* Sala de espera para la primera carga de AdminLayout. En la tienda
                nada es lazy, así que este fallback nunca aparece allí. Navbar y
                Footer quedan fuera para que no desaparezcan mientras carga. */}
            <Suspense fallback={<p>Cargando...</p>}>
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
            </Suspense>

            <Footer />
        </>
    )
}

export default App