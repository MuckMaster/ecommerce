<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Webhook;

// Equivalente de orders.service.js de Node.js
// Gestiona el flujo de checkout con Stripe y el webhook para confirmar pagos
class OrderService
{
    private function eurosToCents(float $euros): int
    {
        return (int) round($euros * 100);
    }

    private function centsToEuros(int $cents): float
    {
        return round($cents / 100, 2);
    }

    // Calcula el coste de envío basado en el subtotal
    // Si el pedido supera SHIPPING_FREE_FROM euros → envío gratis
    // Si no → SHIPPING_PRICE céntimos (por defecto 4.99€)
    private function calculateShipping(int $subtotalCents): int
    {
        $freeFrom     = $this->eurosToCents((float) env('SHIPPING_FREE_FROM', 50));
        $shippingPrice = (int) env('SHIPPING_PRICE', 499);

        return $subtotalCents >= $freeFrom ? 0 : $shippingPrice;
    }

    // Genera un número de pedido único con formato NB-YYYYMMDD-XXXXXX
    // Igual que generateOrderNumber en Node.js
    private function generateOrderNumber(): string
    {
        $date   = now()->format('Ymd');        // 20240315
        $random = strtoupper(bin2hex(random_bytes(3))); // 3 bytes = 6 chars hex
        return "NB-{$date}-{$random}";
    }

    // Formatea un pedido para la respuesta — mismo formato que Node.js formatOrder
    private function formatOrder(Order $order): array
    {
        return [
            'id'       => (string) $order->id,
            'user_id'  => $order->user_id ? (string) $order->user_id : null,
            'order_number'   => $order->order_number,
            'email'          => $order->email,
            'status'         => $order->status,
            'subtotal'       => $this->centsToEuros($order->subtotal_cents),
            'discount'       => $this->centsToEuros($order->discount_cents),
            'shipping'       => $this->centsToEuros($order->shipping_cents),
            'total'          => $this->centsToEuros($order->total_cents),
            'currency'       => $order->currency,
            'shipping_name'           => $order->shipping_name,
            'shipping_phone'          => $order->shipping_phone,
            'shipping_address_line1'  => $order->shipping_address_line1,
            'shipping_address_line2'  => $order->shipping_address_line2,
            'shipping_city'           => $order->shipping_city,
            'shipping_postcode'       => $order->shipping_postcode,
            'shipping_country'        => $order->shipping_country,
            'notes'      => $order->notes,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            // Líneas de pedido — usamos el snapshot guardado en el momento de la compra
            'order_items' => $order->relationLoaded('orderItems')
                ? $order->orderItems->map(fn($item) => [
                    'id'         => (string) $item->id,
                    'order_id'   => (string) $item->order_id,
                    'product_id' => (string) $item->product_id,
                    'variant_id' => $item->variant_id ? (string) $item->variant_id : null,
                    'product_name_snapshot' => $item->product_name_snapshot,
                    'variant_snapshot'      => $item->variant_snapshot,
                    'unit_price' => $this->centsToEuros($item->unit_price_cents),
                    'line_total' => $this->centsToEuros($item->line_total_cents),
                    'qty'        => $item->qty,
                ])->values()->toArray()
                : [],
        ];
    }

    // Crea un pedido a partir del carrito y genera la sesión de Checkout de Stripe
    // Equivalente a checkout() en Node.js
    public function checkout(?string $userId, ?string $sessionId, array $data): array
    {
        // Inicializamos Stripe con la clave secreta
        Stripe::setApiKey(config('services.stripe.secret'));

        // Buscamos el carrito del usuario o sesión anónima
        $cart = $userId
            ? Cart::where('user_id', $userId)->with(['cartItems.product', 'cartItems.variant'])->first()
            : Cart::where('session_id', $sessionId)->with(['cartItems.product', 'cartItems.variant'])->first();

        if (!$cart || $cart->cartItems->isEmpty()) {
            throw new AppException('Cart is empty', 'CART_EMPTY');
        }

        // Calculamos subtotal sumando (precio_unitario * cantidad) de cada item
        $subtotalCents = $cart->cartItems->sum(fn($item) => $item->unit_price_cents * $item->qty);
        $shippingCents = $this->calculateShipping($subtotalCents);
        $totalCents    = $subtotalCents + $shippingCents;

        // Creamos el pedido en la BD con todos los datos de envío
        $order = Order::create([
            'order_number'           => $this->generateOrderNumber(),
            'user_id'                => $userId ?: null,
            'email'                  => $data['email'],
            'status'                 => 'PENDING',
            'subtotal_cents'         => $subtotalCents,
            'shipping_cents'         => $shippingCents,
            'discount_cents'         => 0,
            'total_cents'            => $totalCents,
            'shipping_name'          => $data['shipping_name'],
            'shipping_phone'         => $data['shipping_phone'] ?? null,
            'shipping_address_line1' => $data['shipping_address_line1'],
            'shipping_address_line2' => $data['shipping_address_line2'] ?? null,
            'shipping_city'          => $data['shipping_city'],
            'shipping_postcode'      => $data['shipping_postcode'],
            'shipping_country'       => $data['shipping_country'] ?? 'ES',
            'notes'                  => $data['notes'] ?? null,
        ]);

        // Creamos las líneas de pedido con el snapshot de cada producto
        foreach ($cart->cartItems as $item) {
            $order->orderItems()->create([
                'product_id'            => $item->product_id,
                'variant_id'            => $item->variant_id,
                'product_name_snapshot' => $item->product->name,
                'variant_snapshot'      => $item->variant?->color ?? null,
                'unit_price_cents'      => $item->unit_price_cents,
                'qty'                   => $item->qty,
                'line_total_cents'      => $item->unit_price_cents * $item->qty,
                'created_at'            => now(),
            ]);
        }

        // Construimos los line_items para Stripe Checkout
        $lineItems = $cart->cartItems->map(fn($item) => [
            'price_data' => [
                'currency'     => 'eur',
                'product_data' => [
                    'name'        => $item->product->name,
                    'description' => $item->variant?->color ?? null,
                ],
                'unit_amount' => $item->unit_price_cents,
            ],
            'quantity' => $item->qty,
        ])->toArray();

        // Si hay gastos de envío, los añadimos como línea extra en Stripe
        if ($shippingCents > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency'     => 'eur',
                    'product_data' => ['name' => 'Gastos de envío'],
                    'unit_amount'  => $shippingCents,
                ],
                'quantity' => 1,
            ];
        }

        // Creamos la sesión de Checkout de Stripe
        $stripeSession = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items'           => $lineItems,
            'mode'                 => 'payment',
            'success_url'          => $data['successUrl'],
            'cancel_url'           => $data['cancelUrl'],
            // metadata.order_id nos sirve para actualizar el pedido cuando llega el webhook
            'metadata'             => ['order_id' => (string) $order->id],
            'customer_email'       => $data['email'],
        ]);

        // Guardamos el registro del pago en estado REQUIRES_PAYMENT
        Payment::create([
            'order_id'                   => $order->id,
            'stripe_payment_intent_id'   => $stripeSession->payment_intent ?? $stripeSession->id,
            'stripe_checkout_session_id' => $stripeSession->id,
            'status'                     => 'REQUIRES_PAYMENT',
            'amount_cents'               => $totalCents,
        ]);

        $order->load('orderItems');

        return [
            'order'       => $this->formatOrder($order),
            'checkoutUrl' => $stripeSession->url,
        ];
    }

    // Maneja el webhook de Stripe — se llama cuando Stripe confirma el pago
    // El body DEBE ser el raw JSON (sin parsear) para que la firma funcione
    // En Laravel usamos $request->getContent() que siempre devuelve el raw body
    public function handleWebhook(string $rawBody, string $signature): array
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        try {
            // Stripe verifica que el cuerpo no ha sido modificado y que la firma es válida
            // Si alguien intenta falsificar el webhook, esta llamada lanza una excepción
            $event = Webhook::constructEvent(
                $rawBody,
                $signature,
                config('services.stripe.webhook_secret')
            );
        } catch (\Exception $e) {
            throw new AppException('Invalid webhook signature', 'INVALID_SIGNATURE');
        }

        if ($event->type === 'checkout.session.completed') {
            $stripeSession = $event->data->object;
            $orderId = $stripeSession->metadata->order_id;

            // Marcamos el pedido como PAID
            $order = Order::find($orderId);
            if ($order) {
                $order->update(['status' => 'PAID']);

                // Marcamos el pago como SUCCEEDED
                Payment::where('stripe_checkout_session_id', $stripeSession->id)
                    ->update(['status' => 'SUCCEEDED']);

                // Vaciamos el carrito del usuario para que empiece fresco
                if ($order->user_id) {
                    $cart = Cart::where('user_id', $order->user_id)->first();
                    if ($cart) {
                        $cart->cartItems()->delete();
                    }
                }
            }
        }

        return ['received' => true];
    }

    // Lista los pedidos de un usuario autenticado
    public function getOrders(string $userId): array
    {
        $orders = Order::where('user_id', $userId)
            ->with('orderItems')
            ->orderBy('created_at', 'desc')
            ->get();

        return $orders->map(fn($o) => $this->formatOrder($o))->values()->toArray();
    }

    // Obtiene el detalle de un pedido — solo si pertenece al usuario solicitante
    public function getOrderById(string $userId, string $orderId): ?array
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', $userId)
            ->with(['orderItems', 'payments'])
            ->first();

        if (!$order) return null;
        return $this->formatOrder($order);
    }
}
