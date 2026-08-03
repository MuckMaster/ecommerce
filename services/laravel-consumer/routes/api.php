<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\VariantController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Middleware\OptionalAuthMiddleware;
use App\Http\Middleware\RequireRoleMiddleware;

// ============================================================
// AUTH
// ============================================================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/refresh',  [AuthController::class, 'refresh']);
    Route::post('/logout',   [AuthController::class, 'logout']);

    // Solo usuarios autenticados pueden ver su propio perfil
    Route::get('/me', [AuthController::class, 'me'])
        ->middleware(AuthMiddleware::class);
});

// ============================================================
// PRODUCTS + VARIANTS + IMAGES (todo bajo /products)
// ============================================================
Route::prefix('products')->group(function () {

    // ─── Rutas públicas ───────────────────────────────────────
    // IMPORTANTE: /search debe ir ANTES que /:id para que Laravel no interprete
    // "search" como un ID de producto (igual que en Express el orden de rutas importa)
    Route::get('/',        [ProductController::class, 'index']);
    Route::get('/search',  [ProductController::class, 'search']);
    Route::get('/{id}',    [ProductController::class, 'show']);

    // ─── Rutas de admin (auth + ADMIN) ────────────────────────
    Route::post('/', [ProductController::class, 'store'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::put('/{id}', [ProductController::class, 'update'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::delete('/{id}', [ProductController::class, 'destroy'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);

    // ─── Imágenes (anidadas bajo productos) ───────────────────
    Route::post('/{id}/images', [ImageController::class, 'store'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::put('/{id}/images/{imageId}/primary', [ImageController::class, 'setPrimary'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::delete('/{id}/images/{imageId}', [ImageController::class, 'destroy'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);

    // ─── Variantes (anidadas bajo productos) ──────────────────
    // GET público para que el frontend pueda cargar swatches
    Route::get('/{id}/variants', [VariantController::class, 'index']);

    Route::post('/{id}/variants', [VariantController::class, 'store'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::put('/{id}/variants/{variantId}', [VariantController::class, 'update'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::delete('/{id}/variants/{variantId}', [VariantController::class, 'destroy'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
});

// ============================================================
// CATEGORIES
// ============================================================
Route::prefix('categories')->group(function () {
    Route::get('/',       [CategoryController::class, 'index']);
    Route::get('/{slug}', [CategoryController::class, 'show']); // el param se trata como slug en el service

    Route::post('/', [CategoryController::class, 'store'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::put('/{id}', [CategoryController::class, 'update'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
    Route::delete('/{id}', [CategoryController::class, 'destroy'])
        ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN']);
});

// ============================================================
// CART — todas las rutas usan OptionalAuth
// (funciona para usuarios logueados y para anónimos con X-Session-Id)
// ============================================================
Route::prefix('cart')->middleware(OptionalAuthMiddleware::class)->group(function () {
    Route::get('/',                    [CartController::class, 'index']);
    Route::post('/items',              [CartController::class, 'addItem']);
    Route::put('/items/{itemId}',      [CartController::class, 'updateItem']);
    Route::delete('/items/{itemId}',   [CartController::class, 'removeItem']);
    Route::delete('/',                 [CartController::class, 'clear']);
});

// ============================================================
// ORDERS + STRIPE WEBHOOK
// ============================================================

// El webhook de Stripe necesita el body sin parsear para verificar la firma.
// En Laravel, $request->getContent() siempre devuelve el body raw, por lo que
// NO necesitamos registrar el endpoint antes del middleware JSON (a diferencia de Express).
// Sin embargo, lo registramos aquí sin middleware de auth para que Stripe pueda llamarlo.
Route::post('/orders/webhook', [OrderController::class, 'webhook']);

// Checkout: optionalAuth porque puede pagar con o sin cuenta
Route::post('/orders/checkout', [OrderController::class, 'checkout'])
    ->middleware(OptionalAuthMiddleware::class);

// Ver mis pedidos: solo usuarios autenticados
Route::get('/orders',     [OrderController::class, 'index'])->middleware(AuthMiddleware::class);
Route::get('/orders/{id}', [OrderController::class, 'show'])->middleware(AuthMiddleware::class);

// ============================================================
// CONTACT
// ============================================================
Route::post('/contact', [ContactController::class, 'send']);

// ============================================================
// ADMIN ORDERS — auth + ADMIN obligatorio en todas las rutas
// ============================================================
Route::prefix('admin/orders')
    ->middleware([AuthMiddleware::class, RequireRoleMiddleware::class . ':ADMIN'])
    ->group(function () {
        // IMPORTANTE: /stats ANTES de /{id} para que Laravel no lo interprete como ID
        Route::get('/stats', [AdminOrderController::class, 'stats']);
        Route::get('/',      [AdminOrderController::class, 'index']);
        Route::get('/{id}',  [AdminOrderController::class, 'show']);
        Route::put('/{id}/status', [AdminOrderController::class, 'updateStatus']);
    });
