import { useState } from "react";
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Catalogue from './pages/Catalogue/Catalogue'
import ProductDetail from './pages/ProductDetail/ProductDetail'

function App() {
    const [view, setView] = useState('home')

    const [selectedProduct, setSelectedProduct] = useState(null)

    function onNavigate(destination, product = null) {
        if (destination === 'detail' && product) {
            setSelectedProduct(product)
        }
        setView(destination)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function renderView() {
        switch (view) {
            case 'home':
                return <Home onNavigate={onNavigate}/>
            
            case 'catalogue':
                return <Catalogue onNavigate={onNavigate}/>

            case 'detail':
                if(!selectedProduct) return <Catalogue onNavigate={onNavigate}/>
                return <ProductDetail product={selectedProduct} onNavigate={onNavigate}/>

            default:
                return <Home onNavigate={onNavigate}/>
        }
    }

    return (
        <>
        <Navbar onNavigate={onNavigate}/>
        {renderView()}
        </>
    )
}

export default App