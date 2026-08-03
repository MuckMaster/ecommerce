<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de categories.controller.js de Node.js
class CategoryController extends Controller
{
    protected CategoryService $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    // GET /api/categories
    public function index(): JsonResponse
    {
        try {
            $categories = $this->categoryService->getCategories();
            return response()->json($categories);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/categories/:slug
    public function show(string $slug): JsonResponse
    {
        try {
            $category = $this->categoryService->getCategoryBySlug($slug);
            if (!$category) {
                return response()->json(['error' => 'Category not found'], 404);
            }
            return response()->json($category);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/categories — solo ADMIN
    public function store(Request $request): JsonResponse
    {
        try {
            $name = $request->input('name');
            $slug = $request->input('slug');

            if (!$name || !$slug) {
                return response()->json(['error' => 'Missing required fields: name, slug'], 400);
            }

            $category = $this->categoryService->createCategory($request->all());
            return response()->json($category, 201);

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['error' => 'Slug already in use'], 409);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/categories/:id — solo ADMIN
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $category = $this->categoryService->updateCategory($id, $request->all());
            return response()->json($category);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'NOT_FOUND') {
                return response()->json(['error' => 'Category not found'], 404);
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

    // DELETE /api/categories/:id — solo ADMIN
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->categoryService->deleteCategory($id);
            return response()->json(['ok' => true, 'message' => 'Category deleted']);
        } catch (AppException $e) {
            if ($e->getErrorCode() === 'NOT_FOUND') {
                return response()->json(['error' => 'Category not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
