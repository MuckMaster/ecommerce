<?php

return [
    // Disco de almacenamiento por defecto
    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [
        'local' => [
            'driver' => 'local',
            'root'   => storage_path('app/private'),
            'serve'  => true,
            'throw'  => false,
        ],

        'public' => [
            'driver'     => 'local',
            'root'       => storage_path('app/public'),
            'url'        => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw'      => false,
        ],

        // Disco personalizado para imágenes de productos
        // Razón: En Node.js las imágenes se guardan en uploads/products/ y se sirven
        // en /uploads/products/... Para mantener la misma URL sin que React cambie nada,
        // guardamos directamente en public/uploads/ (accesible vía web sin symlinks)
        'uploads' => [
            'driver'     => 'local',
            'root'       => public_path('uploads'),
            'url'        => env('APP_URL').'/uploads',
            'visibility' => 'public',
            'throw'      => true,
        ],
    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
