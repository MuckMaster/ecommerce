<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\User;
use App\Models\UserSession;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// Equivalente de auth.service.js de Node.js
// Gestiona registro, login, refresh token y logout con JWT + refresh tokens en BD
class AuthService
{
    protected CartService $cartService;

    // Inyectamos CartService para poder fusionar el carrito al registrarse
    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    // Genera el JWT de acceso (15 minutos) con el mismo payload que Node.js:
    // { userId: string, role: string, iat: timestamp, exp: timestamp }
    private function generateAccessToken(User $user): string
    {
        $secret = config('jwt.secret');
        $ttl    = config('jwt.access_ttl'); // 900 segundos = 15 minutos

        $payload = [
            'userId' => (string) $user->id,   // String para compatibilidad con JS
            'role'   => $user->role,
            'iat'    => time(),
            'exp'    => time() + $ttl,
        ];

        // HS256 es el mismo algoritmo que usa Node.js jsonwebtoken por defecto
        return JWT::encode($payload, $secret, 'HS256');
    }

    // Genera el refresh token — es un string hexadecimal aleatorio de 64 bytes
    // (128 caracteres hex), igual que crypto.randomBytes(64).toString('hex') en Node.js
    private function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(64));
    }

    // Hashea el refresh token con SHA-256 — guardamos el HASH en la BD, nunca el token real
    // Igual que crypto.createHash('sha256').update(token).digest('hex') en Node.js
    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    // Calcula la fecha de expiración del refresh token (ahora + 30 días)
    private function getExpiresAt(): \Carbon\Carbon
    {
        return now()->addDays(config('jwt.refresh_ttl_days'));
    }

    // Formatea el usuario para la respuesta — solo campos seguros, sin password_hash
    private function formatUser(User $user): array
    {
        return [
            'id'         => (string) $user->id,  // BigInt → String para que JS lo maneje bien
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'created_at' => $user->created_at,
        ];
    }

    // ─── Métodos públicos ─────────────────────────────────────────────────────

    // Registra un nuevo usuario, genera tokens y fusiona el carrito anónimo si lo hay
    public function register(string $name, string $email, string $password, ?string $sessionId): array
    {
        // Verificamos que el email no esté en uso (igual que Prisma findUnique)
        if (User::where('email', $email)->exists()) {
            throw new AppException('Email already in use', 'EMAIL_TAKEN');
        }

        // Hash de la contraseña con bcrypt (10 rondas, igual que Node.js bcryptjs)
        $passwordHash = Hash::make($password);

        $user = User::create([
            'name'          => $name,
            'email'         => $email,
            'password_hash' => $passwordHash,
        ]);

        $accessToken  = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken();

        // Guardamos el HASH del refresh token (nunca el token en texto plano)
        UserSession::create([
            'user_id'            => $user->id,
            'refresh_token_hash' => $this->hashToken($refreshToken),
            'expires_at'         => $this->getExpiresAt(),
        ]);

        // Si el usuario vino con un carrito anónimo, lo fusionamos con el nuevo carrito
        if ($sessionId) {
            $this->cartService->mergeCart((string) $user->id, $sessionId);
        }

        return [
            'user'         => $this->formatUser($user),
            'accessToken'  => $accessToken,
            'refreshToken' => $refreshToken,
        ];
    }

    // Valida credenciales y genera nuevos tokens
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        // Mensaje de error genérico para no revelar si el email existe o no
        if (!$user || !Hash::check($password, $user->password_hash)) {
            throw new AppException('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        $accessToken  = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken();

        UserSession::create([
            'user_id'            => $user->id,
            'refresh_token_hash' => $this->hashToken($refreshToken),
            'expires_at'         => $this->getExpiresAt(),
        ]);

        return [
            'user'         => $this->formatUser($user),
            'accessToken'  => $accessToken,
            'refreshToken' => $refreshToken,
        ];
    }

    // Genera un nuevo access token a partir de un refresh token válido
    public function refresh(string $refreshToken): array
    {
        if (!$refreshToken) {
            throw new AppException('No refresh token', 'NO_REFRESH_TOKEN');
        }

        $tokenHash = $this->hashToken($refreshToken);

        // Buscamos la sesión por el hash — si alguien roba el hash de la BD,
        // no puede obtener el token original (SHA-256 es unidireccional)
        $session = UserSession::where('refresh_token_hash', $tokenHash)
            ->with('user')
            ->first();

        if (!$session || $session->expires_at < now()) {
            // Si el token existe pero está expirado, lo eliminamos para limpiar la BD
            if ($session) {
                $session->delete();
            }
            throw new AppException('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
        }

        $accessToken = $this->generateAccessToken($session->user);
        return ['accessToken' => $accessToken];
    }

    // Invalida la sesión eliminando el refresh token de la BD
    public function logout(?string $refreshToken): void
    {
        if (!$refreshToken) return;

        $tokenHash = $this->hashToken($refreshToken);
        // deleteMany porque puede haber múltiples sesiones con ese hash (improbable pero seguro)
        UserSession::where('refresh_token_hash', $tokenHash)->delete();
    }

    // Obtiene el usuario por ID para el endpoint /me
    public function getUserById(string $id): ?array
    {
        $user = User::find($id);
        if (!$user) return null;
        return $this->formatUser($user);
    }
}
