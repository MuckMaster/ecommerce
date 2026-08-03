<?php

namespace App\Services;

use App\Exceptions\AppException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Str;

// Equivalente de cart.service.js de Node.js
// El carrito funciona tanto para usuarios logueados (por user_id) como para
// usuarios anónimos (por session_id del header X-Session-Id)
class CartService
{
    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function centsToEuros(int $cents): float
    {
        return round($cents / 100, 2);
    }

    // Formatea un item del carrito para la respuesta — igual que formatItem en Node.js
    private function formatItem(CartItem $item): array
    {
        $lineTotal = $this->centsToEuros($item->unit_price_cents * $item->qty);

        return [
            'id'         => (string) $item->id,
            'cart_id'    => (string) $item->cart_id,
            'product_id' => (string) $item->product_id,
            'variant_id' => $item->variant_id ? (string) $item->variant_id : null,
            'qty'        => $item->qty,
            'unit_price' => $this->centsToEuros($item->unit_price_cents),
            'line_total' => $lineTotal,
            // Datos básicos del producto para mostrar en el carrito
            'product'    => $item->product ? [
                'id'    => (string) $item->product->id,
                'name'  => $item->product->name,
                'slug'  => $item->product->slug,
                // Primera imagen primaria — null si no tiene imágenes
                'image' => $item->product->productImages->first()?->url ?? null,
            ] : null,
            // Datos de la variante seleccionada (color/sku)
            'variant' => $item->variant ? [
                'id'    => (string) $item->variant->id,
                'color' => $item->variant->color,
                'sku'   => $item->variant->sku,
            ] : null,
        ];
    }

    // Formatea el carrito completo con sus items y total
    private function formatCart(Cart $cart): array
    {
        $items = $cart->cartItems->map(fn($item) => $this->formatItem($item))->values()->toArray();

        // Sumamos los line_total de cada item para obtener el total del carrito
        $total = array_reduce($items, fn($sum, $item) => $sum + $item['line_total'], 0.0);

        return [
            'id'         => (string) $cart->id,
            'session_id' => $cart->session_id,
            'user_id'    => $cart->user_id ? (string) $cart->user_id : null,
            'items'      => $items,
            'total'      => round($total, 2),
            'currency'   => $cart->currency,
        ];
    }

    // Constraint de include para cargar siempre los mismos datos de cada item
    // Equivalente al objeto cartInclude de Node.js
    private function loadCartItemsRelations(Cart $cart): Cart
    {
        $cart->load([
            'cartItems.product.productImages' => function ($query) {
                // Solo la imagen primaria para no cargar todas en el carrito
                $query->where('is_primary', true);
            },
            'cartItems.variant',
        ]);
        return $cart;
    }

    // ─── Lógica de obtener/crear carrito ─────────────────────────────────────

    // Busca el carrito del usuario o sesión, lo crea si no existe
    // Equivalente a getOrCreateCart de Node.js
    private function getOrCreateCart(?string $userId, ?string $sessionId): Cart
    {
        if ($userId) {
            // Usuario logueado → buscamos por user_id
            $cart = Cart::where('user_id', $userId)->first();
            if (!$cart) {
                $cart = Cart::create(['user_id' => $userId]);
            }
            return $this->loadCartItemsRelations($cart);
        }

        if ($sessionId) {
            // Usuario anónimo → buscamos por session_id
            $cart = Cart::where('session_id', $sessionId)->first();
            if (!$cart) {
                $cart = Cart::create(['session_id' => $sessionId]);
            }
            return $this->loadCartItemsRelations($cart);
        }

        // Sin userId ni sessionId → creamos carrito anónimo con UUID nuevo
        $newSessionId = (string) Str::uuid();
        $cart = Cart::create(['session_id' => $newSessionId]);
        return $this->loadCartItemsRelations($cart);
    }

    // ─── Métodos públicos ─────────────────────────────────────────────────────

    // Obtiene el carrito del usuario/sesión
    public function getCart(?string $userId, ?string $sessionId): array
    {
        $cart = $this->getOrCreateCart($userId, $sessionId);
        return $this->formatCart($cart);
    }

    // Añade un producto al carrito — si ya existe, suma la cantidad
    public function addItem(?string $userId, ?string $sessionId, string $productId, ?string $variantId, int $qty): array
    {
        $cart = $this->getOrCreateCart($userId, $sessionId);

        $product = Product::find($productId);
        if (!$product) {
            throw new AppException('Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Precio base del producto — si la variante tiene precio propio, lo usamos
        $priceCents = $product->price_cents;
        if ($variantId) {
            $variant = ProductVariant::find($variantId);
            if ($variant && $variant->price_cents) {
                $priceCents = $variant->price_cents;
            }
        }

        // Buscamos si ya existe este producto+variante en el carrito
        $existing = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId ?: null)
            ->first();

        if ($existing) {
            // Si ya existe, sumamos la cantidad
            $existing->update(['qty' => $existing->qty + $qty]);
        } else {
            // Si no existe, creamos un nuevo item
            CartItem::create([
                'cart_id'          => $cart->id,
                'product_id'       => $productId,
                'variant_id'       => $variantId ?: null,
                'qty'              => $qty,
                'unit_price_cents' => $priceCents,
            ]);
        }

        // Devolvemos el carrito actualizado con los datos frescos de la BD
        return $this->getCart($userId, $sessionId);
    }

    // Actualiza la cantidad de un item — si qty <= 0, elimina el item
    public function updateItem(?string $userId, ?string $sessionId, string $itemId, int $qty): array
    {
        $cart = $this->getOrCreateCart($userId, $sessionId);

        // Verificamos que el item pertenece al carrito del usuario (seguridad)
        $item = CartItem::where('id', $itemId)->where('cart_id', $cart->id)->first();
        if (!$item) {
            throw new AppException('Item not found', 'ITEM_NOT_FOUND');
        }

        if ($qty <= 0) {
            // Cantidad 0 o negativa = eliminar el item
            $item->delete();
        } else {
            $item->update(['qty' => $qty]);
        }

        return $this->getCart($userId, $sessionId);
    }

    // Elimina un item del carrito
    public function removeItem(?string $userId, ?string $sessionId, string $itemId): array
    {
        $cart = $this->getOrCreateCart($userId, $sessionId);

        $item = CartItem::where('id', $itemId)->where('cart_id', $cart->id)->first();
        if (!$item) {
            throw new AppException('Item not found', 'ITEM_NOT_FOUND');
        }

        $item->delete();
        return $this->getCart($userId, $sessionId);
    }

    // Vacía todos los items del carrito (pero no elimina el carrito)
    public function clearCart(?string $userId, ?string $sessionId): array
    {
        $cart = $this->getOrCreateCart($userId, $sessionId);
        CartItem::where('cart_id', $cart->id)->delete();
        return $this->getCart($userId, $sessionId);
    }

    // Fusiona el carrito anónimo con el carrito del usuario recién registrado
    // Se llama desde AuthService.register() cuando el usuario tenía items en carrito anónimo
    // Los items se mueven al carrito del usuario; si ya existe el mismo producto+variante,
    // se suman las cantidades en lugar de duplicar
    public function mergeCart(string $userId, string $sessionId): void
    {
        if (!$sessionId) return;

        // Buscamos el carrito anónimo por session_id
        $anonCart = Cart::where('session_id', $sessionId)->with('cartItems')->first();
        if (!$anonCart || $anonCart->cartItems->isEmpty()) return;

        // Obtenemos o creamos el carrito del usuario registrado
        $userCart = Cart::where('user_id', $userId)->first();
        if (!$userCart) {
            $userCart = Cart::create(['user_id' => $userId]);
        }

        // Fusionamos cada item del carrito anónimo
        foreach ($anonCart->cartItems as $item) {
            // Buscamos si el producto+variante ya está en el carrito del usuario
            $existingItem = CartItem::where('cart_id', $userCart->id)
                ->where('product_id', $item->product_id)
                ->where('variant_id', $item->variant_id)
                ->first();

            if ($existingItem) {
                // Ya existe → sumamos cantidades
                $existingItem->update(['qty' => $existingItem->qty + $item->qty]);
            } else {
                // No existe → movemos el item al carrito del usuario
                $item->update(['cart_id' => $userCart->id]);
            }
        }

        // Eliminamos el carrito anónimo (ya no lo necesitamos)
        $anonCart->delete();
    }
}
