<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Tabla para guardar los refresh tokens — igual que en Node.js
// Guardamos el HASH SHA-256 del refresh token, nunca el token en sí
// Así si la BD se compromete, los tokens reales no se exponen
class UserSession extends Model
{
    protected $table = 'user_sessions';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'refresh_token_hash',  // SHA-256 del refresh token real
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    // Relación con el usuario propietario de esta sesión
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
