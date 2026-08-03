<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // Las rutas web (si algún día añadimos vistas) — por ahora solo redirección
        web: __DIR__.'/../routes/web.php',
        // Las rutas de la API — todas las que empieza con /api
        api: __DIR__.'/../routes/api.php',
        // Comandos de consola (Artisan)
        commands: __DIR__.'/../routes/console.php',
        // Endpoint de salud para verificar que el servidor está vivo
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // En Laravel 11, las rutas API ya vienen sin CSRF ni sesión por defecto.
        // Solo configuramos CORS para que React pueda hacer peticiones.
        $middleware->api(prepend: [
            // CORS: permite peticiones desde cualquier origen durante desarrollo
            // En producción cambiar 'allowed_origins' en config/cors.php
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Excluimos el webhook de Stripe del rate limiting y del JSON parsing
        // (aunque en Laravel $request->getContent() siempre devuelve el body raw,
        // por lo que no es estrictamente necesario — a diferencia de Express)
        $middleware->validateCsrfTokens(except: [
            'api/orders/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Cuando una ruta no existe, devolvemos JSON con la clave "error"
        // para que el frontend reciba siempre el mismo formato de error
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['error' => 'Not found'], 404);
            }
        });

        // Errores de validación de Laravel (si alguna vez los usamos directamente)
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                $firstError = collect($e->errors())->flatten()->first();
                return response()->json(['error' => $firstError], 422);
            }
        });
    })->create();
