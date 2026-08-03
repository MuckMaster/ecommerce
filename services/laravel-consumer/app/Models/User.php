<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Modelo del usuario — tabla 'users' creada por las migraciones Prisma
// El campo password se llama password_hash (no el convencional 'password' de Laravel)
// para mantener compatibilidad con la BD existente sin cambiar nada
class User extends Model
{
    // La tabla en MySQL se llama 'users' (igual que Prisma)
    protected $table = 'users';

    // Campos que se pueden asignar masivamente (crear/actualizar)
    protected $fillable = [
        'name',
        'email',
        'password_hash',  // Guardamos el hash, nunca la contraseña en texto plano
        'role',
    ];

    // Campos que NUNCA se incluyen en las respuestas JSON automáticas de Eloquent
    // Aunque en este proyecto formateamos las respuestas manualmente en los services,
    // es buena práctica ocultarlo aquí también como capa extra de seguridad
    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Un usuario puede tener muchas sesiones activas (refresh tokens)
    public function userSessions(): HasMany
    {
        return $this->hasMany(UserSession::class, 'user_id');
    }

    // Un usuario puede tener muchos pedidos
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    // Un usuario puede tener un carrito
    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class, 'user_id');
    }
}
