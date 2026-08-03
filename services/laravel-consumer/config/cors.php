<?php

// CORS — Cross-Origin Resource Sharing
// Permite que React (en un puerto diferente) haga peticiones a esta API
// En Node.js se usaba el paquete 'cors' con cors() sin opciones (permite todo)
// Aquí hacemos lo mismo: permitimos cualquier origen durante desarrollo
return [
    'paths' => ['api/*', 'uploads/*'],

    'allowed_methods' => ['*'],

    // '*' permite cualquier origen — en producción cambiar por el dominio real del frontend
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
