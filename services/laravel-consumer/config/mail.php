<?php

return [
    // Driver de correo — smtp para Gmail con contraseña de aplicación
    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'host'      => env('MAIL_HOST', 'smtp.gmail.com'),
            'port'      => env('MAIL_PORT', 587),
            // tls = STARTTLS (el estándar para Gmail en el puerto 587)
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username'  => env('MAIL_USERNAME'),
            // Para Gmail, usar una contraseña de aplicación (no la contraseña real)
            // Se genera en: Cuenta Google → Seguridad → Contraseñas de aplicación
            'password'  => env('MAIL_PASSWORD'),
            'timeout'   => null,
        ],

        'log' => [
            'transport' => 'log',
            'channel'   => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],
    ],

    // Remitente por defecto para todos los emails
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@rivetbags.com'),
        'name'    => env('MAIL_FROM_NAME', 'Rivet Bags Web'),
    ],
];
