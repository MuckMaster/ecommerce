<?php

// Configuración del JWT — usamos firebase/php-jwt que es el equivalente exacto
// del paquete 'jsonwebtoken' de Node.js. Ambos producen tokens compatibles
// cuando usan el mismo secreto y algoritmo (HS256), lo que facilita la migración.
return [
    // Secreto para firmar los tokens — DEBE ser el mismo que JWT_SECRET en Node.js
    // para que los tokens generados por ambas APIs sean intercambiables
    'secret' => env('JWT_SECRET', 'dev_secret_change_in_prod'),

    // Algoritmo de firma — HS256 es el mismo que usa Node.js por defecto
    'algo' => 'HS256',

    // Tiempo de vida del access token en segundos (15 minutos = 900 segundos)
    // Igual que ACCES_TOKEN_TTL = "15m" en Node.js
    'access_ttl' => 15 * 60,

    // Tiempo de vida del refresh token en días (30 días)
    // El refresh token NO es un JWT — es un string aleatorio hasheado en SHA-256
    // que guardamos en la tabla user_sessions. Esta config controla su expiración.
    'refresh_ttl_days' => 30,
];
