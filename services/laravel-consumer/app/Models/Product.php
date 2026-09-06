<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'care',
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

    // Relación muchos-a-muchos con categorías a través de la tabla product_categories.
    // Esto es DISTINTO de productCategories() (que apunta a la tabla intermedia en sí):
    // aquí saltamos directamente a las categorías, lo que nos permite usar sync().
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            Category::class,        // el modelo destino
            'product_categories',   // la tabla intermedia (pivot)
            'product_id',           // clave de ESTE modelo (product) en la pivot
            'category_id'           // clave del modelo destino (category) en la pivot
        );
    }
}
