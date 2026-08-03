<?php

return [
    // Stripe para pagos — las mismas claves que usa Node.js
    'stripe' => [
        'key'             => env('STRIPE_PUBLISHABLE_KEY'),
        'secret'          => env('STRIPE_SECRET_KEY'),
        // El secreto del webhook sirve para verificar que la petición viene de Stripe
        // y no de alguien malicioso que suplante a Stripe
        'webhook_secret'  => env('STRIPE_WEBHOOK_SECRET'),
    ],

    'mailgun' => [
        'domain'   => env('MAILGUN_DOMAIN'),
        'secret'   => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme'   => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
];
