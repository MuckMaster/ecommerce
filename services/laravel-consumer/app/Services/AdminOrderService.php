<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\DB;

// Equivalente de admin-orders.service.js de Node.js
// Endpoints exclusivos para administradores: listar con filtros, cambiar estado, estadísticas
class AdminOrderService
{
    private function centsToEuros(int $cents): float
    {
        return round($cents / 100, 2);
    }

    // Formatea un pedido con todos los detalles para la vista de admin
    // Incluye datos del usuario, items y historial de cambios de estado
    private function formatOrder(Order $order): array
    {
        return [
            'id'           => (string) $order->id,
            'order_number' => $order->order_number,
            'user_id'      => $order->user_id ? (string) $order->user_id : null,
            'email'        => $order->email,
            'status'       => $order->status,
            'subtotal'     => $this->centsToEuros($order->subtotal_cents),
            'discount'     => $this->centsToEuros($order->discount_cents),
            'shipping'     => $this->centsToEuros($order->shipping_cents),
            'total'        => $this->centsToEuros($order->total_cents),
            'currency'     => $order->currency,
            'shipping_name'          => $order->shipping_name,
            'shipping_phone'         => $order->shipping_phone,
            'shipping_address_line1' => $order->shipping_address_line1,
            'shipping_address_line2' => $order->shipping_address_line2,
            'shipping_city'          => $order->shipping_city,
            'shipping_postcode'      => $order->shipping_postcode,
            'shipping_country'       => $order->shipping_country,
            'notes'        => $order->notes,
            'created_at'   => $order->created_at,
            'updated_at'   => $order->updated_at,
            // Datos del usuario (null si fue compra de invitado)
            'user' => $order->relationLoaded('user') && $order->user ? [
                'id'    => (string) $order->user->id,
                'name'  => $order->user->name,
                'email' => $order->user->email,
            ] : null,
            // Líneas del pedido
            'items' => $order->relationLoaded('orderItems')
                ? $order->orderItems->map(fn($item) => [
                    'id'           => (string) $item->id,
                    'product_id'   => (string) $item->product_id,
                    'variant_id'   => $item->variant_id ? (string) $item->variant_id : null,
                    'product_name' => $item->product_name_snapshot,
                    'variant'      => $item->variant_snapshot,
                    'qty'          => $item->qty,
                    'unit_price'   => $this->centsToEuros($item->unit_price_cents),
                    'line_total'   => $this->centsToEuros($item->line_total_cents),
                ])->values()->toArray()
                : [],
            // Historial de cambios de estado (para auditoría)
            'history' => $order->relationLoaded('orderStatusHistory')
                ? $order->orderStatusHistory->map(fn($h) => [
                    'id'                  => (string) $h->id,
                    'from_status'         => $h->from_status,
                    'to_status'           => $h->to_status,
                    'comment'             => $h->comment,
                    'changed_by_user_id'  => $h->changed_by_user_id ? (string) $h->changed_by_user_id : null,
                    'changed_by'          => $h->relationLoaded('users') && $h->users ? [
                        'id'   => (string) $h->users->id,
                        'name' => $h->users->name,
                    ] : null,
                    'created_at' => $h->created_at,
                ])->values()->toArray()
                : [],
        ];
    }

    // Lista pedidos con filtros opcionales y paginación
    // Soporta: ?status=PAID&from=2024-01-01&to=2024-12-31&q=NB-2024&page=1&limit=20
    public function listOrders(array $filters = []): array
    {
        $query = Order::query();

        // Filtro por estado del pedido
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filtro por rango de fechas
        if (!empty($filters['from'])) {
            $query->where('created_at', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->where('created_at', '<=', $filters['to']);
        }

        // Búsqueda por número de pedido, email o nombre de envío
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function ($subQuery) use ($q) {
                $subQuery->where('order_number', 'LIKE', "%{$q}%")
                         ->orWhere('email', 'LIKE', "%{$q}%")
                         ->orWhere('shipping_name', 'LIKE', "%{$q}%");
            });
        }

        // Paginación — igual que skip/take en Prisma
        $page  = max(1, (int) ($filters['page'] ?? 1));
        $limit = (int) ($filters['limit'] ?? 20);
        $skip  = ($page - 1) * $limit;

        // Ejecutamos las dos consultas en paralelo: resultados + total
        // DB::transaction no es necesario aquí — son lecturas independientes
        $total  = (clone $query)->count();
        $orders = $query
            ->with(['user', 'orderItems'])
            ->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return [
            'data'       => $orders->map(fn($o) => $this->formatOrder($o))->values()->toArray(),
            'pagination' => [
                'total' => $total,
                'page'  => $page,
                'limit' => $limit,
                'pages' => (int) ceil($total / $limit), // Total de páginas para el paginador
            ],
        ];
    }

    // Obtiene el detalle completo de un pedido incluyendo historial
    public function getOrderById(string $orderId): ?array
    {
        $order = Order::with([
            'user',
            'orderItems',
            'orderStatusHistory' => fn($q) => $q->with('users')->orderBy('created_at', 'asc'),
            'payments',
        ])->find($orderId);

        if (!$order) return null;
        return $this->formatOrder($order);
    }

    // Cambia el estado de un pedido y registra el cambio en el historial
    // Usamos una transacción de BD para que ambas operaciones sean atómicas:
    // si falla el historial, el estado tampoco se actualiza (y viceversa)
    public function updateOrderStatus(string $orderId, string $newStatus, ?string $comment, string $adminUserId): array
    {
        $currentOrder = Order::find($orderId);
        if (!$currentOrder) {
            throw new AppException('Order not found', 'ORDER_NOT_FOUND');
        }

        // Si el estado es el mismo, no hacemos nada — igual que Node.js
        if ($currentOrder->status === $newStatus) {
            throw new AppException('Order already in this status', 'SAME_STATUS');
        }

        // Transacción: actualizar estado + crear registro de historial como una sola operación
        DB::transaction(function () use ($currentOrder, $orderId, $newStatus, $comment, $adminUserId) {
            $currentOrder->update(['status' => $newStatus]);

            OrderStatusHistory::create([
                'order_id'           => $orderId,
                'from_status'        => $currentOrder->getOriginal('status'), // Estado ANTES del update
                'to_status'          => $newStatus,
                'changed_by_user_id' => $adminUserId,
                'comment'            => $comment ?: null,
                'created_at'         => now(),
            ]);
        });

        // Devolvemos el pedido actualizado con el historial completo
        return $this->getOrderById($orderId);
    }

    // Estadísticas del dashboard de admin — conteos e ingresos
    // Equivalente a getStats() en Node.js
    public function getStats(): array
    {
        $now      = now();
        $today    = $now->copy()->startOfDay();
        $thisMonth = $now->copy()->startOfMonth();
        $thirtyDaysAgo = $now->copy()->subDays(30);

        // Ejecutamos todas las consultas de agregación en un solo paso
        // Para ingresos solo contamos pedidos PAID o SHIPPED (revenue real)
        $paidStatuses = ['PAID', 'SHIPPED'];

        return [
            'orders' => [
                'total'      => Order::count(),
                'pending'    => Order::where('status', 'PENDING')->count(),
                'paid'       => Order::where('status', 'PAID')->count(),
                'shipped'    => Order::where('status', 'SHIPPED')->count(),
                'today'      => Order::where('created_at', '>=', $today)->count(),
                'this_month' => Order::where('created_at', '>=', $thisMonth)->count(),
            ],
            'revenue' => [
                // _sum.total_cents puede ser null si no hay pedidos — usamos 0 como fallback
                'total' => $this->centsToEuros(
                    (int) Order::whereIn('status', $paidStatuses)->sum('total_cents')
                ),
                'this_month' => $this->centsToEuros(
                    (int) Order::whereIn('status', $paidStatuses)
                        ->where('created_at', '>=', $thisMonth)
                        ->sum('total_cents')
                ),
                'last_30_days' => $this->centsToEuros(
                    (int) Order::whereIn('status', $paidStatuses)
                        ->where('created_at', '>=', $thirtyDaysAgo)
                        ->sum('total_cents')
                ),
            ],
        ];
    }
}
