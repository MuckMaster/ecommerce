<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'sku',
        'color',
        'color_css',    // CSS personalizado (ej: "#FF0000") — si es null usamos el mapa de colores
        'price_cents',  // Precio propio de la variante — si es null hereda el del producto
        'stock_qty',
        'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // Imágenes específicas de esta variante (para mostrar el color correcto)
    public function productImages(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'variant_id');
    }
}
