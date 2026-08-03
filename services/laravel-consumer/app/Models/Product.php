<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Modelo de producto con soft delete manual (deleted_at en lugar del SoftDeletes de Laravel)
// Usamos soft delete manual porque la BD ya tiene el campo deleted_at de Prisma
// y queremos mantener compatibilidad — el SoftDeletes trait de Laravel también usa deleted_at
// pero lo añadimos manualmente para mayor claridad
class Product extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'name',
        'slug',
        'short_description',
        'description',
        'price_cents',   // Guardamos en céntimos, convertimos a euros en las respuestas
        'currency',
        'status',        // DRAFT o PUBLISHED
        'material',
        'is_featured',
        'deleted_at',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'deleted_at'  => 'datetime',
    ];

    // Imágenes del producto ordenadas por sort_order
    public function productImages(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id');
    }

    // Variantes del producto (colores/tallas)
    public function productVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    // Categorías asociadas al producto (tabla intermedia product_categories)
    public function productCategories(): HasMany
    {
        return $this->hasMany(ProductCategory::class, 'product_id');
    }
}
