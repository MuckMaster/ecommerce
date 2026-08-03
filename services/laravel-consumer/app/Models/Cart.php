<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// El carrito puede ser anónimo (tiene session_id) o de un usuario (tiene user_id)
// Ambos tipos pueden existir a la vez — cuando el usuario se registra,
// se fusiona el carrito anónimo con el del usuario (mergeCart en AuthService)
class Cart extends Model
{
    protected $table = 'carts';

    protected $fillable = [
        'user_id',    // null si es carrito anónimo
        'session_id', // null si es carrito de usuario registrado
        'currency',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Items dentro del carrito
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class, 'cart_id');
    }

    // Usuario propietario (puede ser null si es carrito anónimo)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
