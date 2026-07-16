<?php

namespace App\Services;

use App\Exceptions\OutOfStockException;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class OrderService
{
    /**
     * ایجاد سفارش جدید از روی سبد خرید کاربر
     *
     * @param User $user
     * @param Cart $cart
     * @param array $shippingAddress آدرس به صورت آرایه (توسط مدل به JSON تبدیل می‌شود)
     * @param string $paymentMethod
     * @return Order
     * @throws OutOfStockException
     * @throws InvalidArgumentException
     */
    public function createOrderFromCart(User $user, Cart $cart, array $shippingAddress, string $paymentMethod = 'online'): Order
    {
        return DB::transaction(function () use ($user, $cart, $shippingAddress, $paymentMethod) {
            // ۱. بررسی خالی نبودن سبد خرید
            $cart->load('items.product');
            if ($cart->items->isEmpty()) {
                throw new InvalidArgumentException('سبد خرید شما خالی است.');
            }

            // ۲. بررسی نهایی موجودی تمام محصولات قبل از ثبت سفارش
            foreach ($cart->items as $item) {
                if ($item->product->stock < $item->quantity) {
                    throw new OutOfStockException("موجودی محصول '{$item->product->name}' به اندازه کافی نیست. (موجودی: {$item->product->stock})");
                }
            }

            // ۳. محاسبات مالی
            $subtotal = (float) $cart->subtotal;
            $tax = $subtotal * 0.09; // ۹٪ مالیات بر ارزش افزوده (قابل تنظیم)
            $shipping = 35000; // هزینه ارسال ثابت (می‌تواند بر اساس آدرس محاسبه شود)
            $discount = (float) $cart->discount;
            $total = $subtotal + $tax + $shipping - $discount;

            // ۴. تولید شماره سفارش یکتا
            $orderNumber = 'AZK-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // ۵. ایجاد رکورد سفارش
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping' => $shipping,
                'discount' => $discount,
                'total' => $total,
                'shipping_address' => $shippingAddress, // مدل به طور خودکار این را به JSON تبدیل می‌کند
            ]);

            // ۶. ایجاد آیتم‌های سفارش و کسر موجودی انبار
            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'seller_id' => $item->product->seller_id ?? null, // اگر محصول seller_id داشته باشد
                    'quantity' => $item->quantity,
                    'price' => $item->price, // قیمت در لحظه خرید فریز می‌شود
                    'total' => $item->price * $item->quantity,
                ]);

                // کسر موجودی از جدول محصولات
                $item->product->decrement('stock', $item->quantity);
            }

            // ۷. تخلیه کامل سبد خرید پس از ثبت موفق سفارش
            $cart->items()->delete();
            $cart->update([
                'items_count' => 0,
                'subtotal' => 0,
                'discount' => 0,
                'total' => 0,
            ]);

            // بازگرداندن سفارش همراه با جزئیات
            return $order->load('items.product.seller');
        });
    }

    /**
     * تغییر وضعیت سفارش
     */
    public function updateOrderStatus(Order $order, string $newStatus): Order
    {
        $allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!in_array($newStatus, $allowedStatuses)) {
            throw new InvalidArgumentException('وضعیت سفارش نامعتبر است.');
        }

        $order->update(['status' => $newStatus]);
        return $order->fresh();
    }

    /**
     * تغییر وضعیت پرداخت سفارش
     */
    public function updatePaymentStatus(Order $order, string $newPaymentStatus): Order
    {
        $allowedStatuses = ['pending', 'paid', 'failed', 'refunded'];
        
        if (!in_array($newPaymentStatus, $allowedStatuses)) {
            throw new InvalidArgumentException('وضعیت پرداخت نامعتبر است.');
        }

        $order->update(['payment_status' => $newPaymentStatus]);
        return $order->fresh();
    }

    /**
     * لغو سفارش و بازگرداندن موجودی به انبار
     */
    public function cancelOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            if ($order->status === 'cancelled') {
                return $order;
            }

            if (in_array($order->status, ['shipped', 'delivered'])) {
                throw new InvalidArgumentException('سفارش ارسال یا تحویل شده و قابل لغو نیست.');
            }

            // بازگرداندن موجودی محصولات به انبار
            foreach ($order->items as $item) {
                $item->product->increment('stock', $item->quantity);
            }

            $order->update([
                'status' => 'cancelled',
                'payment_status' => $order->payment_status === 'paid' ? 'refunded' : 'failed',
            ]);

            return $order->fresh();
        });
    }
}