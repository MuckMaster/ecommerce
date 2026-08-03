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

            $image = $this->imageService->uploadProductImage($id, $file, $altText, $isPrimary);
            return response()->json($image, 201);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'PRODUCT_NOT_FOUND') {
                return response()->json(['error' => 'Product not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/products/:id/images/:imageId/primary — solo ADMIN
    public function setPrimary(string $id, string $imageId): JsonResponse
    {
        try {
            $image = $this->imageService->setPrimaryImage($id, $imageId);
            return response()->json($image);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'IMAGE_NOT_FOUND') {
                return response()->json(['error' => 'Image not found'], 404);
            }
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
}
