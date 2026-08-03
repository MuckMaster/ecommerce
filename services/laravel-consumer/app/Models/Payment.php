<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Registro del pago de Stripe asociado a un pedido
// Guardamos el ID de la sesión de checkout de Stripe para poder verificar el webhook
class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'order_id',
        'provider',                      // "stripe" por defecto
        'stripe_payment_intent_id',      // ID del Payment Intent de Stripe
        'stripe_checkout_session_id',    // ID de la sesión de Checkout de Stripe
        'status',                        // REQUIRES_PAYMENT, SUCCEEDED, FAILED, REFUNDED
        'amount_cents',
        'currency',
        'raw_event',                     // JSON del evento webhook de Stripe (para auditoría)
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
