<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de cart.controller.js de Node.js
// Todas las rutas usan OptionalAuthMiddleware: funciona para usuarios logueados y anónimos
class CartController extends Controller
{
    protected CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    // GET /api/cart
    public function index(Request $request): JsonResponse
    {
        try {
            // userId y sessionId los pone OptionalAuthMiddleware en los attributes
            $userId    = $request->attributes->get('userId');
            $sessionId = $request->attributes->get('sessionId');

            $cart = $this->cartService->getCart($userId, $sessionId);
            return response()->json($cart);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/cart/items
    public function addItem(Request $request): JsonResponse
    {
        try {
            $productId = $request->input('productId');
            $variantId = $request->input('variantId');
            $qty       = (int) $request->input('qty');

            if (!$productId || !$qty || $qty < 1) {
                return response()->json(['error' => 'Missing required fields: productId, qty'], 400);
            }

            $userId    = $request->attributes->get('userId');
            $sessionId = $request->attributes->get('sessionId');

            $cart = $this->cartService->addItem($userId, $sessionId, $productId, $variantId, $qty);
            return response()->json($cart);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'PRODUCT_NOT_FOUND') {
                return response()->json(['error' => 'Product not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/cart/items/:itemId
    public function updateItem(Request $request, string $itemId): JsonResponse
    {
        try {
            $qty = $request->input('qty');
            if ($qty === null) {
                return response()->json(['error' => 'Missing required field: qty'], 400);
            }

            $userId    = $request->attributes->get('userId');
            $sessionId = $request->attributes->get('sessionId');

            $cart = $this->cartService->updateItem($userId, $sessionId, $itemId, (int) $qty);
            return response()->json($cart);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'ITEM_NOT_FOUND') {
                return response()->json(['error' => 'Item not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // DELETE /api/cart/items/:itemId
    public function removeItem(Request $request, string $itemId): JsonResponse
    {
        try {
            $userId    = $request->attributes->get('userId');
            $sessionId = $request->attributes->get('sessionId');

            $cart = $this->cartService->removeItem($userId, $sessionId, $itemId);
            return response()->json($cart);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'ITEM_NOT_FOUND') {
                return response()->json(['error' => 'Item not found'], 404);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // DELETE /api/cart — vacía el carrito completo
    public function clear(Request $request): JsonResponse
    {
        try {
            $userId    = $request->attributes->get('userId');
            $sessionId = $request->attributes->get('sessionId');

            $cart = $this->cartService->clearCart($userId, $sessionId);
            return response()->json($cart);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
