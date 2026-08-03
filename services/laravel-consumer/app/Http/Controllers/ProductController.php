<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de products.controller.js de Node.js
class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    // GET /api/products?status=PUBLISHED&featured=true&category=bolsos
    public function index(Request $request): JsonResponse
    {
        try {
            $products = $this->productService->getProducts(
                $request->query('status'),
                $request->query('featured'),
                $request->query('category')
            );
            return response()->json($products);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/products/search?q=bolso
    public function search(Request $request): JsonResponse
    {
        try {
            $products = $this->productService->searchProducts($request->query('q', ''));
            return response()->json($products);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/products/:id
    public function show(string $id): JsonResponse
    {
        try {
            $product = $this->productService->getProductById($id);
            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }
            return response()->json($product);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/products — solo ADMIN
    public function store(Request $request): JsonResponse
    {
        try {
            $name  = $request->input('name');
            $slug  = $request->input('slug');
            $price = $request->input('price');

            if (!$name || !$slug || $price === null) {
                return response()->json(['error' => 'Missing required fields: name, slug, price'], 400);
            }

            $product = $this->productService->createProduct($request->all());
            return response()->json($product, 201);

        } catch (\Illuminate\Database\QueryException $e) {
            // Error 23000 = Duplicate entry (slug ya en uso)
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'Slug already in use'], 409);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/products/:id — solo ADMIN
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $product = $this->productService->updateProduct($id, $request->all());
            return response()->json($product);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'NOT_FOUND') {
                return response()->json(['error' => 'Product not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'Slug already in use'], 409);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // DELETE /api/products/:id — soft delete, solo ADMIN
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->productService->deleteProduct($id);
            return response()->json(['ok' => true, 'message' => 'Product deleted']);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'NOT_FOUND') {
                return response()->json(['error' => 'Product not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
