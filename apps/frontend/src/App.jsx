import { Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Catalogue from './pages/Catalogue/Catalogue'
import ProductDetail from './pages/ProductDetail/ProductDetail'

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />}/>
                <Route path="/catalogo" element={<Catalogue />}/>
                <Route path="/producto/:id" element={<ProductDetail/>}/>
            </Routes>
        </>
    )
}

export default App