<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Category;
use App\Models\ProductCategory;

// Equivalente de categories.service.js de Node.js
class CategoryService
{
    private function centsToEuros(int $cents): float
    {
        return round($cents / 100, 2);
    }

    // Formato básico de categoría (solo campos propios, sin relaciones)
    private function formatCategory(Category $category): array
    {
        return [
            'id'          => (string) $category->id,
            'name'        => $category->name,
            'slug'        => $category->slug,
            'description' => $category->description,
            'sort_order'  => $category->sort_order,
            'is_active'   => $category->is_active,
            'created_at'  => $category->created_at,
            'updated_at'  => $category->updated_at,
        ];
    }

    // Lista todas las categorías activas ordenadas por sort_order
    public function getCategories(): array
    {
        $categories = Category::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get();

        return $categories->map(fn($c) => $this->formatCategory($c))->values()->toArray();
    }

    // Obtiene una categoría por slug con los productos PUBLISHED asociados
    // NOTA: La versión Node.js tenía un bug en el include (filtraba product_categories
    // con un campo que no existe en esa tabla). Aquí implementamos el comportamiento
    // CORRECTO: categoría + productos publicados + imagen primaria de cada producto
    public function getCategoryBySlug(string $slug): ?array
    {
        $category = Category::where('slug', $slug)->first();
        if (!$category) return null;

        // Cargamos los productos de esta categoría que estén PUBLISHED y no borrados
        $category->load([
            'productCategories' => function ($query) {
                // Cargamos los productos activos a través de la tabla pivot
                $query->with(['products' => function ($q) {
                    $q->where('status', 'PUBLISHED')
                      ->whereNull('deleted_at')
                      ->with(['productImages' => function ($imgQ) {
                          // Solo la imagen primaria para la vista de categoría
                          $imgQ->where('is_primary', true);
                      }]);
                }]);
            },
        ]);

        $data = $this->formatCategory($category);

        // Incluimos product_categories con los datos de los productos
        // El formato coincide con lo que Prisma devolvería si la query fuera correcta
        $data['product_categories'] = $category->productCategories
            ->filter(fn($pc) => $pc->products !== null) // Solo registros con producto activo
            ->map(fn($pc) => [
                'product_id'  => (string) $pc->product_id,
                'category_id' => (string) $pc->category_id,
                'products'    => [
                    'id'             => (string) $pc->products->id,
                    'name'           => $pc->products->name,
                    'slug'           => $pc->products->slug,
                    'short_description' => $pc->products->short_description,
                    'price'          => $this->centsToEuros($pc->products->price_cents),
                    'status'         => $pc->products->status,
                    'is_featured'    => $pc->products->is_featured,
                    'created_at'     => $pc->products->created_at,
                    'product_images' => $pc->products->productImages->map(fn($img) => [
                        'id'         => (string) $img->id,
                        'url'        => $img->url,
                        'alt_text'   => $img->alt_text,
                        'is_primary' => $img->is_primary,
                    ])->values()->toArray(),
                ],
            ])
            ->values()
            ->toArray();

        return $data;
    }

    // Crea una nueva categoría
    public function createCategory(array $data): array
    {
        $category = Category::create([
            'name'        => $data['name'],
            'slug'        => $data['slug'],
            'description' => $data['description'] ?? null,
            'sort_order'  => $data['sort_order'] ?? 0,
        ]);
        return $this->formatCategory($category);
    }

    // Actualiza solo los campos enviados
    public function updateCategory(string $id, array $data): array
    {
        $category = Category::find($id);
        if (!$category) {
            throw new AppException('Category not found', 'NOT_FOUND');
        }

        $updateData = [];
        if (isset($data['name']))        $updateData['name']        = $data['name'];
        if (isset($data['slug']))        $updateData['slug']        = $data['slug'];
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['sort_order']))  $updateData['sort_order']  = $data['sort_order'];
        if (array_key_exists('is_active', $data)) $updateData['is_active'] = $data['is_active'];

        $category->update($updateData);
        return $this->formatCategory($category);
    }

    // Elimina una categoría (hard delete — los productos no se borran, solo la asociación)
    public function deleteCategory(string $id): void
    {
        $category = Category::find($id);
        if (!$category) {
            throw new AppException('Category not found', 'NOT_FOUND');
        }
        $category->delete();
    }
}
