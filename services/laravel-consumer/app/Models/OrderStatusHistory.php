<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Historial de cambios de estado de un pedido
// Cada vez que un admin cambia el estado, se guarda un registro aquí
// Esto permite auditar quién cambió qué y cuándo
class OrderStatusHistory extends Model
{
    protected $table = 'order_status_history';

    // Solo created_at en esta tabla
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'from_status',          // Estado anterior (puede ser null si es la creación)
        'to_status',            // Nuevo estado
        'changed_by_user_id',   // ID del admin que hizo el cambio
        'comment',              // Nota opcional del admin
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    // El admin que realizó el cambio — 'users' como nombre para coincidir con Prisma
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
