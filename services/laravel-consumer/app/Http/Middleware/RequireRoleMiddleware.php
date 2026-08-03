<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

// Equivalente exacto de role.middleware.js de Node.js
// Verifica que el usuario autenticado tiene el rol requerido
// DEBE usarse después de AuthMiddleware (que es quien pone userRole en el request)
// Uso en rutas: ->middleware(['auth', 'role:ADMIN'])
class RequireRoleMiddleware
{
    // $role viene de los parámetros del middleware en la definición de ruta
    // Por ejemplo: RequireRoleMiddleware::class . ':ADMIN'
    public function handle(Request $request, Closure $next, string $role)
    {
        $userRole = $request->attributes->get('userRole');

        // Si el rol del usuario no coincide con el requerido, devolvemos 403
        // 403 = "Forbidden" — el usuario está autenticado pero sin permisos
        if ($userRole !== $role) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
