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

    // Sube una imagen al servidor y crea el registro en BD
    // Ahora también acepta $variantId para asociar la imagen a una variante concreta
    public function uploadProductImage(
        string $productId, 
        UploadedFile $file, 
        string $altText = null, 
        bool $isPrimary = false,
        ?string $variantId = null   // NUEVO: opcional, ID de la variante a la que pertenece la imagen
    ): array
    {
        // Verificamos que el producto existe
        $product = Product::find($productId);
        if (!$product) {
            // Si el producto no existe, borramos el archivo que ya se subió para no dejar basura
            Storage::delete($file->getPathname());
            throw new AppException('Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Si nos pasan un variant_id, verificamos que exista Y pertenezca al producto
        // Esto evita que se asocie una imagen a una variante de otro producto
        if ($variantId) {
            $variant = \App\Models\ProductVariant::where('id', $variantId)
                ->where('product_id', $productId)
                ->first();
            
            if (!$variant) {
                throw new AppException('Variant not found', 'VARIANT_NOT_FOUND');
            }
        }

        // Si esta imagen se marca como principal, quitamos el flag de las demás
        // Solo puede haber una imagen principal por producto (o por variante si tiene variant_id)
        if ($isPrimary) {
            $query = ProductImage::where('product_id', $productId)
                ->where('is_primary', true);
            
            // Si es imagen de variante, el flag "principal" es dentro de esa variante
            if ($variantId) {
                $query->where('variant_id', $variantId);
            } else {
                $query->whereNull('variant_id');
            }
            
            $query->update(['is_primary' => false]);
        }

        // Calculamos el sort_order siguiente para que la imagen aparezca al final
        $lastImage = ProductImage::where('product_id', $productId)
            ->when($variantId, fn($q) => $q->where('variant_id', $variantId))
            ->when(!$variantId, fn($q) => $q->whereNull('variant_id'))
            ->orderBy('sort_order', 'desc')
            ->first();
        
        $sortOrder = $lastImage ? $lastImage->sort_order + 1 : 0;

        // Guardamos el archivo físico en public/uploads/products/
        // Generamos el nombre PRIMERO y lo usamos tanto para el move como para la URL
        // Usamos storeAs con el disco 'uploads' que ya apunta a public/uploads/
        $filename = bin2hex(random_bytes(8)) . '.' . $file->getClientOriginalExtension();
        $file->storeAs('products', $filename, 'uploads');


        // Guardamos la imagen en BD con los nuevos campos
        $image = ProductImage::create([
            'product_id' => $productId,
            'variant_id' => $variantId,          // NUEVO: puede ser null si es del producto
            'url' => $this->getPublicUrl($filename),
            'alt_text' => $altText ?? $product->name,
            'sort_order' => $sortOrder,
            'is_primary' => $isPrimary,
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

    // Reasigna una imagen existente a una variante (o al producto general si variant_id es null)
    // Útil cuando el admin quiere mover imágenes entre variantes o convertir imágenes
    // del producto en imágenes de una variante concreta
    public function reassignImage(string $imageId, ?string $variantId): array
    {
        $image = ProductImage::find($imageId);
        if (!$image) {
            throw new AppException('Image not found', 'IMAGE_NOT_FOUND');
        }

        // Si nos dan variant_id, verificamos que la variante existe Y pertenece al mismo producto
        // Esto evita mover una imagen a una variante de otro producto
        if ($variantId) {
            $variant = \App\Models\ProductVariant::where('id', $variantId)
                ->where('product_id', $image->product_id)
                ->first();

            if (!$variant) {
                throw new AppException('Variant not found or does not belong to this product', 'VARIANT_NOT_FOUND');
            }
        }

        // Actualizamos solo el campo variant_id, el resto se mantiene
        $image->variant_id = $variantId;
        $image->save();

        return $this->formatImage($image);
    }
}
