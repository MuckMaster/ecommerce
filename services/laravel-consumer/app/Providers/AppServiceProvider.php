<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    // Registramos aquí los bindings de servicios si los necesitamos
    public function register(): void
    {
        // AuthService necesita CartService — Laravel resuelve la inyección automáticamente
        // gracias al autoloader y el contenedor de dependencias (IoC container)
        // No hace falta registrar nada manualmente si usamos type hints en los constructores
    }

    public function boot(): void
    {
        // En producción, forzamos HTTPS para que los URLs generados sean seguros
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
