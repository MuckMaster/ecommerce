<?php

return [
    // Driver de base de datos por defecto — usamos MySQL como Node.js
    'default' => env('DB_CONNECTION', 'mysql'),

    'connections' => [
        'mysql' => [
            'driver'    => 'mysql',
            'host'      => env('DB_HOST', 'mysql'),          // En Docker, el host es el nombre del servicio
            'port'      => env('DB_PORT', '3306'),
            'database'  => env('DB_DATABASE', 'ecommerce_bolsos'),
            'username'  => env('DB_USERNAME', '1234'),
            'password'  => env('DB_PASSWORD', '1234'),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix'    => '',
            // strict: false permite valores enum no definidos sin lanzar errores
            // Útil mientras la BD tiene enums que Eloquent no conoce
            'strict'    => false,
            'engine'    => null,
            'options'   => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'sqlite' => [
            'driver'   => 'sqlite',
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix'   => '',
        ],
    ],

    // Migraciones de Laravel — aunque no usamos migraciones (la BD ya existe vía Prisma)
    // este config es necesario para que artisan funcione
    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
        'default' => [
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', 6379),
            'database' => env('REDIS_DB', 0),
        ],
    ],
];
