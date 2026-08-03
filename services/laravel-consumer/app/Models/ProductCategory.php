<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Tabla pivot entre productos y categorías
// En Prisma tiene clave compuesta (product_id, category_id) sin id propio
// Usamos un Model normal (no Pivot) para poder hacer queries sobre ella directamente
class ProductCategory extends Model
{
    protected $table = 'product_categories';

    // No hay id autoincrement ni timestamps en esta tabla
    public $incrementing = false;
    public $timestamps   = false;

    // Clave primaria compuesta — Eloquent no soporta PKs compuestas nativamente,
    // así que desactivamos la PK y gestionamos la unicidad en las queries
    protected $primaryKey = null;

    protected $fillable = [
        'product_id',
        'category_id',
    ];

    // Relación con el producto — usamos 'products' como nombre para coincidir
    // con el output de Prisma: product_categories[n].products
    public function products(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // Relación con la categoría
    public function categories(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
