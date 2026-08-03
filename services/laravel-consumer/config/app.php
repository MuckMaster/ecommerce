<?php

return [
    // Nombre de la app — aparece en emails y logs
    'name' => env('APP_NAME', 'Laravel Consumer'),

    'env' => env('APP_ENV', 'production'),

    // En producción debe ser false para no exponer errores al usuario
    'debug' => (bool) env('APP_DEBUG', false),

    'url' => env('APP_URL', 'http://localhost'),

    'timezone' => env('APP_TIMEZONE', 'UTC'),

    'locale' => env('APP_LOCALE', 'es'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    // Clave de cifrado de Laravel — se genera con php artisan key:generate
    // Usada internamente para cifrar cookies y sesiones (no para JWT)
    'key' => env('APP_KEY'),

    'cipher' => 'AES-256-CBC',

    'maintenance' => ['driver' => 'file'],

    // Proveedores de servicio adicionales que queramos registrar
    'providers' => \Illuminate\Support\ServiceProvider::defaultProviders()->merge([
        App\Providers\AppServiceProvider::class,
    ])->toArray(),

    'aliases' => \Illuminate\Support\Facades\Facade::defaultAliases()->merge([
        // Aquí podríamos añadir alias para facades personalizados
    ])->toArray(),
];
