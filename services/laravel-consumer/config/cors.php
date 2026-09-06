<?php

// CORS — Cross-Origin Resource Sharing
// Permite que React (en un puerto diferente) haga peticiones a esta API
// En Node.js se usaba el paquete 'cors' con cors() sin opciones (permite todo)
// Aquí hacemos lo mismo: permitimos cualquier origen durante desarrollo
return [
    'paths' => ['api/*', 'uploads/*'],

    'allowed_methods' => ['*'],

        // Dominios del frontend autorizados a llamar a la API
    'allowed_origins' => ['https://rivetbag.com', 'http://localhost:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
