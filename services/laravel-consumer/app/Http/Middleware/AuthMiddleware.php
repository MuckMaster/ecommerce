<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

// Equivalente exacto de auth.middleware.js de Node.js
// Extrae el JWT del header Authorization, lo verifica y pasa userId/role al controlador
// Si el token no existe o es inválido, devuelve 401 (nunca deja pasar)
class AuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');

        // Verificamos que el header existe y tiene el formato "Bearer <token>"
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        // Extraemos solo el token (quitamos el prefijo "Bearer ")
        $token = substr($authHeader, 7);

        try {
            // Decodificamos y verificamos el JWT con el mismo secreto que Node.js
            // La clave 'HS256' debe coincidir con el algoritmo usado al generar el token
            $secret = config('jwt.secret');
            $payload = JWT::decode($token, new Key($secret, 'HS256'));

            // Pasamos userId y role al request para que los controladores los lean
            // Usamos el attribute bag para no mezclar con los datos del body
            $request->attributes->set('userId', $payload->userId);
            $request->attributes->set('userRole', $payload->role);

        } catch (ExpiredException $e) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        } catch (SignatureInvalidException $e) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        return $next($request);
    }
}
