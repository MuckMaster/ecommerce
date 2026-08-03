<?php

namespace App\Http\Controllers;

use App\Exceptions\AppException;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de orders.controller.js de Node.js
class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    // POST /api/orders/checkout — optionalAuth (funciona con y sin cuenta)
    public function checkout(Request $request): JsonResponse
    {
        try {
            $email                 = $request->input('email');
            $shippingName          = $request->input('shipping_name');
            $shippingAddressLine1  = $request->input('shipping_address_line1');
            $shippingCity          = $request->input('shipping_city');
            $shippingPostcode      = $request->input('shipping_postcode');
            $successUrl            = $request->input('successUrl');
            $cancelUrl             = $request->input('cancelUrl');

            // Validamos los campos obligatorios de envío
            if (!$email || !$shippingName || !$shippingAddressLine1 || !$shippingCity || !$shippingPostcode) {
                return response()->json(['error' => 'Missing required shipping fields'], 400);
            }

            if (!$successUrl || !$cancelUrl) {
                return response()->json(['error' => 'Missing required fields: successUrl, cancelUrl'], 400);
            }

            $userId    = $request->attributes->get('userId');
            $sessionId = $request->attributes->get('sessionId');

            $result = $this->orderService->checkout($userId, $sessionId, $request->all());
            return response()->json($result);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'CART_EMPTY') {
                return response()->json(['error' => 'Cart is empty'], 400);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // POST /api/orders/webhook — sin auth, body RAW
    // IMPORTANTE: En Laravel $request->getContent() siempre devuelve el body sin parsear,
    // por lo que no necesitamos registro especial antes del middleware JSON (a diferencia de Express)
    public function webhook(Request $request): JsonResponse
    {
        try {
            $signature = $request->header('stripe-signature');

            if (!$signature) {
                return response()->json(['error' => 'Missing stripe signature'], 400);
            }

            // getContent() devuelve el body raw (bytes originales) — necesario para verificar la firma
            $rawBody = $request->getContent();

            $result = $this->orderService->handleWebhook($rawBody, $signature);
            return response()->json($result);

        } catch (AppException $e) {
            if ($e->getErrorCode() === 'INVALID_SIGNATURE') {
                return response()->json(['error' => 'Invalid webhook signature'], 400);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/orders — requiere auth
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = $request->attributes->get('userId');
            $orders = $this->orderService->getOrders($userId);
            return response()->json($orders);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/orders/:id — requiere auth
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $userId = $request->attributes->get('userId');
            $order  = $this->orderService->getOrderById($userId, $id);

            if (!$order) {
                return response()->json(['error' => 'Order not found'], 404);
            }

            return response()->json($order);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
