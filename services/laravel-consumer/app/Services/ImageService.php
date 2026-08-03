<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// Equivalente de images.service.js de Node.js
// Gestiona la subida, marcado de primaria y borrado de imágenes de productos
// Las imágenes se guardan en public/uploads/products/ y se sirven en /uploads/products/...
// (misma URL que usaba Node.js con express.static)
class ImageService
{
    // Construye la URL pública de una imagen
    // Igual que getPublicUrl en Node.js: '/uploads/products/filename.jpg'
    private function getPublicUrl(string $filename): string
    {
        return '/uploads/products/' . $filename;
    }

    // Formatea una imagen para la respuesta
    private function formatImage(ProductImage $image): array
    {
        return [
            'id'         => (string) $image->id,
            'product_id' => (string) $image->product_id,
            'variant_id' => $image->variant_id ? (string) $image->variant_id : null,
            'url'        => $image->url,
            'alt_text'   => $image->alt_text,
            'sort_order' => $image->sort_order,
            'is_primary' => $image->is_primary,
            'created_at' => $image->created_at,
        ];
    }

    // Sube una imagen para un producto y la guarda en el disco 'uploads'
    // Si is_primary es true, desmarca la imagen primaria anterior
    public function uploadProductImage(string $productId, UploadedFile $file, ?string $altText, bool $isPrimary): array
    {
        // Verificamos que el producto existe antes de guardar el archivo
        $product = Product::find($productId);
        if (!$product) {
            throw new AppException('Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Generamos un nombre de archivo aleatorio (igual que Node.js: 8 bytes hex + extensión)
        $extension = $file->getClientOriginalExtension();
        $filename  = bin2hex(random_bytes(8)) . '.' . $extension;

        // Guardamos el archivo en public/uploads/products/
        // El disco 'uploads' tiene root = public_path('uploads')
        Storage::disk('uploads')->putFileAs('products', $file, $filename);

        if ($isPrimary) {
            // Si esta imagen es la primaria, desmarcamos cualquier otra imagen primaria del producto
            ProductImage::where('product_id', $productId)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        // Calculamos el sort_order siguiente (después de la última imagen)
        $lastSortOrder = ProductImage::where('product_id', $productId)
            ->max('sort_order');
        $sortOrder = $lastSortOrder !== null ? $lastSortOrder + 1 : 0;

        $image = ProductImage::create([
            'product_id' => $productId,
            'url'        => $this->getPublicUrl($filename),
            'alt_text'   => $altText ?: $product->name, // fallback al nombre del producto
            'sort_order' => $sortOrder,
            'is_primary' => $isPrimary,
            'created_at' => now(),
        ]);

        return $this->formatImage($image);
    }

    // Marca una imagen como la primaria del producto, desmarcando las demás
    public function setPrimaryImage(string $productId, string $imageId): array
    {
        // Primero desmarcamos todas las imágenes del producto
        ProductImage::where('product_id', $productId)
            ->update(['is_primary' => false]);

        // Luego marcamos solo la imagen seleccionada
        $image = ProductImage::find($imageId);
        if (!$image) {
            throw new AppException('Image not found', 'IMAGE_NOT_FOUND');
        }
        $image->update(['is_primary' => true]);
        $image->refresh();

        return $this->formatImage($image);
    }

    // Elimina una imagen del disco y de la BD
    public function deleteProductImage(string $imageId): void
    {
        $image = ProductImage::find($imageId);
        if (!$image) {
            throw new AppException('Image not found', 'IMAGE_NOT_FOUND');
        }

        // Extraemos el nombre del archivo de la URL (/uploads/products/abc.jpg → abc.jpg)
        $filename = basename($image->url);

        // Intentamos borrar el archivo del disco — si no existe, lo ignoramos
        // (el archivo podría haberse borrado manualmente)
        if (Storage::disk('uploads')->exists('products/' . $filename)) {
            Storage::disk('uploads')->delete('products/' . $filename);
        }

        $image->delete();
    }
}
