<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Product;
use App\Models\ProductVariant;

// Equivalente de variants.service.js de Node.js
// Gestiona las variantes de color de los productos (swatches)
class VariantService
{
    private function eurosToCents(float $euros): int
    {
        return (int) round($euros * 100);
    }

    private function centsToEuros(int $cents): float
    {
        return round($cents / 100, 2);
    }

    // Mapa de colores por defecto — si el admin no especifica color_css,
    // usamos este mapa para asignar un color CSS al nombre del color
    // Igual que el defaultColorMap de Node.js
    private array $defaultColorMap = [
        'negro'    => '#000000',
        'blanco'   => '#FFFFFF',
        'rojo'     => '#DC143C',
        'azul'     => '#1E90FF',
        'verde'    => '#228B22',
        'amarillo' => '#FFD700',
        'naranja'  => '#FF8C00',
        'marron'   => '#8B4513',
        'beige'    => '#F5F5DC',
        'gris'     => '#808080',
        'rosa'     => '#FFC0CB',
        'morado'   => '#9370DB',
    ];

    // Devuelve el color CSS apropiado: personalizado > mapa > gris neutro
    private function resolveColorCss(string $colorName, ?string $customCss): string
    {
        if ($customCss) return $customCss;
        $key = strtolower(trim($colorName));
        return $this->defaultColorMap[$key] ?? '#CCCCCC';
    }

    // Formatea una variante para el frontend — debe coincidir con el componente de swatches
    private function formatVariant(ProductVariant $variant): array
    {
        return [
            'id'         => (string) $variant->id,
            'product_id' => (string) $variant->product_id,
            'sku'        => $variant->sku,
            'name'       => $variant->color,    // El frontend usa swatch.name para mostrar el color
            'css'        => $this->resolveColorCss($variant->color, $variant->color_css), // swatch.css
            'price'      => $variant->price_cents ? $this->centsToEuros($variant->price_cents) : null,
            'stock_qty'  => $variant->stock_qty,
            'is_active'  => $variant->is_active,
            // Imágenes específicas de esta variante (para mostrar el color correcto al seleccionar)
            'images' => $variant->relationLoaded('productImages')
                ? $variant->productImages->map(fn($img) => [
                    'id'         => (string) $img->id,
                    'url'        => $img->url,
                    'alt_text'   => $img->alt_text,
                    'sort_order' => $img->sort_order,
                    'is_primary' => $img->is_primary,
                ])->values()->toArray()
                : [],
        ];
    }

    // Lista variantes activas de un producto
    public function getVariantsByProduct(string $productId): array
    {
        $variants = ProductVariant::where('product_id', $productId)
            ->where('is_active', true)
            ->with(['productImages' => fn($q) => $q->orderBy('sort_order', 'asc')])
            ->orderBy('created_at', 'asc')
            ->get();

        return $variants->map(fn($v) => $this->formatVariant($v))->values()->toArray();
    }

    // Crea una nueva variante para un producto
    public function createVariant(string $productId, array $data): array
    {
        // Verificamos que el producto existe
        $product = Product::find($productId);
        if (!$product) {
            throw new AppException('Product not found', 'PRODUCT_NOT_FOUND');
        }

        $variant = ProductVariant::create([
            'product_id' => $productId,
            'sku'        => $data['sku'],
            'color'      => $data['color'],
            'color_css'  => $data['color_css'] ?? null, // null → usará el mapa de colores
            'price_cents' => isset($data['price']) ? $this->eurosToCents($data['price']) : null,
            'stock_qty'  => $data['stock_qty'] ?? 0,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        $variant->load('productImages');
        return $this->formatVariant($variant);
    }

    // Actualiza solo los campos enviados
    public function updateVariant(string $variantId, array $data): array
    {
        $variant = ProductVariant::find($variantId);
        if (!$variant) {
            throw new AppException('Variant not found', 'NOT_FOUND');
        }

        $updateData = [];
        if (isset($data['sku']))       $updateData['sku']       = $data['sku'];
        if (isset($data['color']))     $updateData['color']     = $data['color'];
        if (array_key_exists('color_css', $data)) $updateData['color_css'] = $data['color_css'];
        if (array_key_exists('price', $data)) {
            // null significa "heredar precio del producto", número significa precio propio
            $updateData['price_cents'] = $data['price'] === null
                ? null
                : $this->eurosToCents($data['price']);
        }
        if (isset($data['stock_qty']))  $updateData['stock_qty']  = $data['stock_qty'];
        if (array_key_exists('is_active', $data)) $updateData['is_active'] = $data['is_active'];

        $variant->update($updateData);
        $variant->load('productImages');
        return $this->formatVariant($variant);
    }

    // Elimina una variante (hard delete — las imágenes en cascada por FK)
    public function deleteVariant(string $variantId): void
    {
        $variant = ProductVariant::find($variantId);
        if (!$variant) {
            throw new AppException('Variant not found', 'NOT_FOUND');
        }
        $variant->delete();
    }
}
