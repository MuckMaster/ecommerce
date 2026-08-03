<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Product;
use App\Models\ProductCategory;

// Equivalente de products.service.js de Node.js
// CRUD de productos con soft delete (deleted_at) y conversión de precios
class ProductService
{
    // ─── Helpers de precios ───────────────────────────────────────────────────

    // Convierte euros a céntimos para guardar en BD: 29.99 → 2999
    private function eurosToCents(float $euros): int
    {
        return (int) round($euros * 100);
    }

    // Convierte céntimos a euros para la respuesta: 2999 → 29.99
    private function centsToEuros(int $cents): float
    {
        return round($cents / 100, 2);
    }

    // ─── Formato de respuesta ─────────────────────────────────────────────────

    // Formatea un producto con todos sus relations para la respuesta del frontend
    // Coincide exactamente con la función formatProduct de Node.js
    private function formatProduct(Product $product): array
    {
        return [
            'id'                => (string) $product->id,
            'name'              => $product->name,
            'slug'              => $product->slug,
            'short_description' => $product->short_description,
            'description'       => $product->description,
            'price'             => $this->centsToEuros($product->price_cents), // euros, no céntimos
            // price_cents se omite intencionalmente para que el frontend use 'price'
            'currency'          => $product->currency,
            'status'            => $product->status,
            'material'          => $product->material,
            'is_featured'       => $product->is_featured,
            'created_at'        => $product->created_at,
            'updated_at'        => $product->updated_at,
            'deleted_at'        => $product->deleted_at,
            // Variantes formateadas (solo las activas)
            'product_variants'  => $product->relationLoaded('productVariants')
                ? $product->productVariants->map(fn($v) => $this->formatVariant($v))->values()->toArray()
                : [],
            // Imágenes formateadas ordenadas por sort_order
            'product_images' => $product->relationLoaded('productImages')
                ? $product->productImages->map(fn($img) => [
                    'id'         => (string) $img->id,
                    'product_id' => (string) $img->product_id,
                    'variant_id' => $img->variant_id ? (string) $img->variant_id : null,
                    'url'        => $img->url,
                    'alt_text'   => $img->alt_text,
                    'sort_order' => $img->sort_order,
                    'is_primary' => $img->is_primary,
                    'created_at' => $img->created_at,
                ])->values()->toArray()
                : [],
            // Categorías del producto
            'product_categories' => $product->relationLoaded('productCategories')
                ? $product->productCategories->map(fn($pc) => [
                    'category_id' => (string) $pc->category_id,
                    'categories'  => $pc->categories ? [
                        'id'         => (string) $pc->categories->id,
                        'name'       => $pc->categories->name,
                        'slug'       => $pc->categories->slug,
                        'sort_order' => $pc->categories->sort_order,
                        'is_active'  => $pc->categories->is_active,
                    ] : null,
                ])->values()->toArray()
                : [],
        ];
    }

    // Formatea una variante para incluir en el producto
    private function formatVariant($variant): array
    {
        return [
            'id'         => (string) $variant->id,
            'product_id' => (string) $variant->product_id,
            'sku'        => $variant->sku,
            'color'      => $variant->color,
            'color_css'  => $variant->color_css,
            'price'      => $variant->price_cents ? $this->centsToEuros($variant->price_cents) : null,
            'stock_qty'  => $variant->stock_qty,
            'is_active'  => $variant->is_active,
        ];
    }

    // ─── Métodos públicos ─────────────────────────────────────────────────────

    // Lista productos con filtros opcionales — igual que getProducts en Node.js
    public function getProducts(?string $status = null, ?string $featured = null, ?string $category = null): array
    {
        $query = Product::whereNull('deleted_at');

        // Si no se especifica status, mostramos solo publicados (no drafts)
        $query->where('status', $status ?: 'PUBLISHED');

        if ($featured !== null) {
            // El parámetro llega como string "true"/"false" desde la URL
            $query->where('is_featured', $featured === 'true');
        }

        if ($category) {
            // Filtramos productos que tengan la categoría con el slug dado
            $query->whereHas('productCategories.categories', function ($q) use ($category) {
                $q->where('slug', $category);
            });
        }

        $products = $query
            ->with([
                'productImages' => fn($q) => $q->orderBy('sort_order', 'asc'),
                'productVariants' => fn($q) => $q->where('is_active', true),
                'productCategories.categories',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return $products->map(fn($p) => $this->formatProduct($p))->values()->toArray();
    }

    // Obtiene un producto por ID con todas sus relaciones
    public function getProductById(string $id): ?array
    {
        $product = Product::whereNull('deleted_at')
            ->with([
                'productImages' => fn($q) => $q->orderBy('sort_order', 'asc'),
                'productVariants' => fn($q) => $q->where('is_active', true),
                'productCategories.categories',
            ])
            ->find($id);

        if (!$product) return null;
        return $this->formatProduct($product);
    }

    // Busca productos por nombre o descripción
    public function searchProducts(string $q): array
    {
        if (!$q) return [];

        $products = Product::whereNull('deleted_at')
            ->where('status', 'PUBLISHED')
            ->where(function ($query) use ($q) {
                // OR entre nombre y descripción corta — igual que Prisma OR con contains
                $query->where('name', 'LIKE', "%{$q}%")
                      ->orWhere('short_description', 'LIKE', "%{$q}%");
            })
            ->with([
                // En la búsqueda solo cargamos la imagen primaria (más eficiente)
                'productImages' => fn($q) => $q->where('is_primary', true),
                'productVariants' => fn($q) => $q->where('is_active', true),
                'productCategories.categories',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return $products->map(fn($p) => $this->formatProduct($p))->values()->toArray();
    }

    // Crea un nuevo producto — precio en euros, se guarda en céntimos
    public function createProduct(array $data): array
    {
        $product = Product::create([
            'name'              => $data['name'],
            'slug'              => $data['slug'],
            'short_description' => $data['short_description'] ?? null,
            'description'       => $data['description'] ?? null,
            'price_cents'       => $this->eurosToCents($data['price']),
            'material'          => $data['material'] ?? null,
            'is_featured'       => $data['is_featured'] ?? false,
            'status'            => $data['status'] ?? 'DRAFT',
        ]);

        // Cargamos las relaciones vacías para que el formato sea consistente
        $product->load(['productImages', 'productVariants', 'productCategories.categories']);
        return $this->formatProduct($product);
    }

    // Actualiza solo los campos enviados (PATCH parcial) — igual que Node.js
    // BUGFIX: en Node.js hay un bug: `if (price !== undefined) updateData.material = material`
    // Lo corregimos aquí: si llega price, actualizamos price_cents
    public function updateProduct(string $id, array $data): array
    {
        $product = Product::find($id);
        if (!$product) {
            throw new AppException('Product not found', 'NOT_FOUND');
        }

        $updateData = [];
        if (isset($data['name']))              $updateData['name']              = $data['name'];
        if (isset($data['slug']))              $updateData['slug']              = $data['slug'];
        if (isset($data['short_description'])) $updateData['short_description'] = $data['short_description'];
        if (isset($data['description']))       $updateData['description']       = $data['description'];
        if (isset($data['price']))             $updateData['price_cents']       = $this->eurosToCents($data['price']);
        if (isset($data['material']))          $updateData['material']          = $data['material'];
        if (array_key_exists('is_featured', $data)) $updateData['is_featured'] = $data['is_featured'];
        if (isset($data['status']))            $updateData['status']            = $data['status'];

        $product->update($updateData);
        $product->load(['productImages', 'productVariants', 'productCategories.categories']);
        return $this->formatProduct($product);
    }

    // Soft delete: marcamos deleted_at con la fecha actual en lugar de borrar el registro
    // Esto preserva el historial de pedidos que referencian este producto
    public function deleteProduct(string $id): void
    {
        $product = Product::find($id);
        if (!$product) {
            throw new AppException('Product not found', 'NOT_FOUND');
        }
        $product->update(['deleted_at' => now()]);
    }
}
