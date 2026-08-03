<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\VariantService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de variants.controller.js de Node.js
// Las rutas de variantes están anidadas bajo /products/:id/variants
class VariantController extends Controller
{
    protected VariantService $variantService;

    public function __construct(VariantService $variantService)
    {
        $this->variantService = $variantService;
    }

    // GET /api/products/:id/variants
    // El param :id es el product ID (viene de la ruta padre igual que mergeParams en Express)
    public function index(string $id): JsonResponse
    {
        try {
            $variants = $this->variantService->getVariantsByProduct($id);
            return response()->json($variants);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/products/:id/variants — solo ADMIN
    public function store(Request $request, string $id): JsonResponse
    {
        try {
            $sku   = $request->input('sku');
            $color = $request->input('color');

            if (!$sku || !$color) {
                return response()->json(['error' => 'Missing required fields: sku, color'], 400);
            }

            $variant = $this->variantService->createVariant($id, $request->all());
            return response()->json($variant, 201);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'PRODUCT_NOT_FOUND') {
                return response()->json(['error' => 'Product not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'SKU already in use'], 409);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/products/:id/variants/:variantId — solo ADMIN
    // :id es el product ID (disponible pero no necesario aquí)
    // :variantId es el ID de la variante a actualizar
    public function update(Request $request, string $id, string $variantId): JsonResponse
    {
        try {
            $variant = $this->variantService->updateVariant($variantId, $request->all());
            return response()->json($variant);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'NOT_FOUND') {
                return response()->json(['error' => 'Variant not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'SKU already in use'], 409);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // DELETE /api/products/:id/variants/:variantId — solo ADMIN
    public function destroy(string $id, string $variantId): JsonResponse
    {
        try {
            $this->variantService->deleteVariant($variantId);
            return response()->json(['ok' => true, 'message' => 'Variant deleted']);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'NOT_FOUND') {
                return response()->json(['error' => 'Variant not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
