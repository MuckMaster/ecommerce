<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Línea de pedido — guarda un snapshot del producto en el momento de la compra
// El snapshot es importante porque el nombre o precio puede cambiar después,
// pero el historial del pedido debe conservar lo que se compró exactamente
class OrderItem extends Model
{
    protected $table = 'order_items';

    // Solo created_at (no updated_at) según el schema de Prisma
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'product_name_snapshot',  // Nombre del producto en el momento de compra
        'variant_snapshot',       // Color de la variante en el momento de compra
        'unit_price_cents',
        'qty',
        'line_total_cents',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
