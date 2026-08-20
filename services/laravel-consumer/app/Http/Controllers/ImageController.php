<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de images.controller.js de Node.js
// Gestiona subida, marcado de primaria y borrado de imágenes de productos
class ImageController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    // POST /api/products/:id/images — solo ADMIN
    // Sube una imagen para el producto — equivalente a multer + uploadProductImage
    // AHORA también acepta variant_id opcional para asociar la imagen a una variante
    public function store(Request $request, string $id): JsonResponse
    {
        try {
            // Validamos que se subió un archivo
            if (!$request->hasFile('image')) {
                return response()->json(['error' => 'No file uploaded'], 400);
            }

            $file = $request->file('image');

            // Validamos el tipo MIME — solo imágenes (igual que fileFilter en multer)
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!in_array($file->getMimeType(), $allowedMimes)) {
                return response()->json(['error' => 'Invalid file type'], 400);
            }

            // Validamos el tamaño — máximo 5MB (igual que multer limits)
            if ($file->getSize() > 5 * 1024 * 1024) {
                return response()->json(['error' => 'File too large (max 5MB)'], 400);
            }

            $altText   = $request->input('alt_text');
            // is_primary puede llegar como string "true" o boolean true — normalizamos
            $isPrimary = $request->input('is_primary') === 'true' || $request->input('is_primary') === true;
            
            // NUEVO: variant_id opcional para imágenes asociadas a variantes
            // Si viene, la imagen "pertenecerá" a esa variante en lugar de al producto en general
            $variantId = $request->input('variant_id');

            $image = $this->imageService->uploadProductImage($id, $file, $altText, $isPrimary, $variantId);
            return response()->json($image, 201);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'PRODUCT_NOT_FOUND') {
                return response()->json(['error' => 'Product not found'], 404);
            }
            // NUEVO: manejo del error cuando la variante no existe
            if ($e->getErrorCode() === 'VARIANT_NOT_FOUND') {
                return response()->json(['error' => 'Variant not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // Cambia cuál es la imagen principal entre las que YA están subidas
// Ruta: PUT /{id}/images/{imageId}/primary
public function setPrimary(string $id, string $imageId): JsonResponse
{
    try {
        // Llamamos al service pasándole los dos IDs que vienen en la URL:
        //   $id      → el producto  ({id} en la ruta)
        //   $imageId → la imagen    ({imageId} en la ruta)
        $image = $this->imageService->setPrimaryImage($id, $imageId);

        // 200 (no 201) porque NO estamos creando nada nuevo,
        // solo modificando el estado de una imagen que ya existía
        return response()->json($image, 200);

    } catch (AppException $e) {
        // Si el service no encontró la imagen, lo traducimos a un 404 limpio
        if ($e->getErrorCode() === 'IMAGE_NOT_FOUND') {
            return response()->json(['error' => 'Image not found'], 404);
        }
        // Cualquier otro error: lo registramos y devolvemos 500 genérico
        \Log::error($e);
        return response()->json(['error' => 'Internal server error'], 500);
    }
}

    // DELETE /api/products/:id/images/:imageId — solo ADMIN
    public function destroy(string $id, string $imageId): JsonResponse
    {
        try {
            $this->imageService->deleteProductImage($imageId);
            return response()->json(['ok' => true, 'message' => 'Image deleted']);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'IMAGE_NOT_FOUND') {
                return response()->json(['error' => 'Image not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PATCH /api/products/:id/images/:imageId — solo ADMIN
    // Reasigna una imagen a una variante o la desvincula (variant_id = null)
    public function update(Request $request, string $id, string $imageId): JsonResponse
    {
        try {
            // variant_id puede ser null explícitamente para desvincular de una variante
            // Usamos has() en vez de input() para distinguir "no enviado" de "enviado como null"
            $variantId = $request->input('variant_id');

            $image = $this->imageService->reassignImage($imageId, $variantId);
            return response()->json($image);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'IMAGE_NOT_FOUND') {
                return response()->json(['error' => 'Image not found'], 404);
            }
            if ($e->getErrorCode() === 'VARIANT_NOT_FOUND') {
                return response()->json(['error' => 'Variant not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
