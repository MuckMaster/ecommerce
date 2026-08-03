<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $table = 'product_images';

    // No hay updated_at en esta tabla (Prisma solo generó created_at)
    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'variant_id',   // null si es imagen del producto general, bigint si es de una variante
        'url',
        'alt_text',
        'sort_order',   // Orden de visualización (0 = primero)
        'is_primary',   // Solo una imagen puede ser primary por producto
        'created_at',
    ];

    protected $casts = [
        'is_primary'  => 'boolean',
        'created_at'  => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
