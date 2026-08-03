<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\AppException;
use App\Http\Controllers\Controller;
use App\Services\AdminOrderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Equivalente de admin-orders.controller.js de Node.js
// Todas las rutas de este controlador requieren auth + rol ADMIN (configurado en routes/api.php)
class AdminOrderController extends Controller
{
    protected AdminOrderService $adminOrderService;

    public function __construct(AdminOrderService $adminOrderService)
    {
        $this->adminOrderService = $adminOrderService;
    }

    // GET /api/admin/orders/stats — IMPORTANTE: esta ruta va ANTES de /:id en routes/api.php
    // Si estuviera después, Laravel interpretaría "stats" como un ID de pedido
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->adminOrderService->getStats();
            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/admin/orders?status=PAID&page=1&limit=20&q=NB-2024
    public function index(Request $request): JsonResponse
    {
        try {
            $result = $this->adminOrderService->listOrders($request->query());
            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // GET /api/admin/orders/:id
    public function show(string $id): JsonResponse
    {
        try {
            $order = $this->adminOrderService->getOrderById($id);
            if (!$order) {
                return response()->json(['error' => 'Order not found'], 404);
            }
            return response()->json($order);
        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    // PUT /api/admin/orders/:id/status
    // Cambia el estado del pedido y registra el cambio en el historial
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            $status  = $request->input('status');
            $comment = $request->input('comment');

            // Validamos que el nuevo estado sea uno de los permitidos
            $validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED', 'REFUNDED'];
            if (!$status || !in_array($status, $validStatuses)) {
                return response()->json([
                    'error' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses),
                ], 400);
            }

            // adminUserId viene del AuthMiddleware — necesario para el historial de cambios
            $adminUserId = $request->attributes->get('userId');

            $order = $this->adminOrderService->updateOrderStatus($id, $status, $comment, $adminUserId);
            return response()->json($order);

        } catch (AppException $e) {
            $code = $e->getErrorCode();
            if ($code === 'ORDER_NOT_FOUND') {
                return response()->json(['error' => 'Order not found'], 404);
            }
            if ($code === 'SAME_STATUS') {
                return response()->json(['error' => 'Order already in this status'], 400);
            }
            \Log::error($e);
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}
