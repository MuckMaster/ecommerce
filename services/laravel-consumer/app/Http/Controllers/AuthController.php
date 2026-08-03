<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de auth.controller.js de Node.js
// Valida los inputs, llama al service y formatea la respuesta HTTP
class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    // POST /api/auth/register
    public function register(Request $request): JsonResponse
    {
        try {
            $name     = $request->input('name');
            $email    = $request->input('email');
            $password = $request->input('password');
            // El sessionId viene del header X-Session-Id para fusionar el carrito anónimo
            $sessionId = $request->header('x-session-id');

            if (!$name || !$email || !$password) {
                return response()->json(['error' => 'Missing required fields'], 400);
            }

            $result = $this->authService->register($name, $email, $password, $sessionId);
            return response()->json($result, 201);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'EMAIL_TAKEN') {
                return response()->json(['error' => 'Email already in use'], 409);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        try {
            $email    = $request->input('email');
            $password = $request->input('password');

            if (!$email || !$password) {
                return response()->json(['error' => 'Missing required fields'], 400);
            }

            $result = $this->authService->login($email, $password);
            return response()->json($result);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'INVALID_CREDENTIALS') {
                return response()->json(['error' => 'Invalid credentials'], 401);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/auth/refresh
    // Recibe el refresh token en el body y devuelve un nuevo access token
    public function refresh(Request $request): JsonResponse
    {
        try {
            $refreshToken = $request->input('refreshToken');
            $result = $this->authService->refresh($refreshToken);
            return response()->json($result);

        } catch (AppException $e) {
            $code = $e->getErrorCode();
            if ($code === 'INVALID_REFRESH_TOKEN' || $code === 'NO_REFRESH_TOKEN') {
                return response()->json(['error' => 'Invalid or expired refresh token'], 401);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/auth/logout
    // Invalida el refresh token para que no se pueda usar más
    public function logout(Request $request): JsonResponse
    {
        try {
            $refreshToken = $request->input('refreshToken');
            $this->authService->logout($refreshToken);
            // Igual que Node.js: devolvemos ok:true incluso si el token no existía
            return response()->json(['ok' => true, 'message' => 'Logged out']);

        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal service error'], 500);
        }
    }

    // GET /api/auth/me — protegido por AuthMiddleware
    // Devuelve los datos del usuario autenticado
    public function me(Request $request): JsonResponse
    {
        try {
            // userId viene del AuthMiddleware a través de $request->attributes
            $userId = $request->attributes->get('userId');
            $user   = $this->authService->getUserById($userId);

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            return response()->json($user);

        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
