<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Equivalente exacto de optionalAuth.middleware.js de Node.js
// Intenta autenticar al usuario PERO NO rechaza la petición si no hay token
// Útil para el carrito y checkout: funciona para usuarios logueados y anónimos
// Los usuarios anónimos se identifican por el header X-Session-Id
class OptionalAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');

        // Si hay token, intentamos decodificarlo — si falla, simplemente lo ignoramos
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);

            try {
                $secret = config('jwt.secret');
                $payload = JWT::decode($token, new Key($secret, 'HS256'));

                // Token válido: guardamos userId y role en los atributos del request
                $request->attributes->set('userId', $payload->userId);
                $request->attributes->set('userRole', $payload->role);

            } catch (\Exception $e) {
                // Token inválido o expirado — lo ignoramos y continuamos sin autenticación
                // A diferencia de AuthMiddleware, aquí no devolvemos 401
            }
        }

        // Siempre leemos el sessionId aunque haya token — para el carrito anónimo
        // El sessionId es un UUID generado por el frontend y enviado en cada petición
        $sessionId = $request->header('x-session-id');
        $request->attributes->set('sessionId', $sessionId ?: null);

        return $next($request);
    }
}
