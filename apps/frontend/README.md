# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Nivet Bags — Frontend

Frontend de presentación para la tienda Nivet Bags, desarrollado en React + Vite.

## Instalación
```bash
npm install
npm run dev
```

## Añadir o editar productos

Todos los datos de productos están en `src/data/products.js`.

### Estructura de un producto
```js
{
  id: 1,                        // número único, no repetir
  name: 'Nombre del producto',
  color: 'Color principal',
  price: 300,                   // precio en euros
  category: 'Tote',             // categoría principal
  subcategory: 'Artesanal',     // subcategoría
  images: [
    '/images/foto1.jpg',        // mínimo 1, máximo 4 imágenes
    '/images/foto2.jpg',
  ],
  swatches: [],                 // dejar vacío si no hay opciones de color
  description: 'Descripción del producto.',
}
```

###Carrusel 

Carrusel se encuentra en `src/data/products.js` al final del archivo, para editar, simplemente cambiar parametros de las imagenes dentro del codigo.

### Añadir imágenes

Colocar las imágenes en `public/images/` y referenciarlas como `/images/nombre.jpg`.

### Logo

En `src/components/Navbar/Navbar.jsx` hay un comentario indicando dónde sustituir el texto "Nivet Bags" por la imagen del logo cuando esté disponible.

## Estructura del proyecto
```
src/
├── data/
│   └── products.js        ← datos de productos y carrusel
├── components/
│   ├── Navbar/
│   ├── Carousel/
│   ├── ProductCard/
│   └── Accordion/
└── pages/
    ├── Home/
    ├── Catalogue/
    └── ProductDetail/
```

## Build para producción
```bash
npm run build
```

Genera la carpeta `dist/` lista para subir al servidor.

**Nota**: Al subir al servidor configurar el redireccionamiento de todas las rutas a `index.html` para que React Router funcione correctamente.
