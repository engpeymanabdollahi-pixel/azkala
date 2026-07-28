<?php

namespace App\Listeners;

use App\Events\Order\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

// ✅ اضافه کردن implements ShouldQueue
class NotifySellerOfNewOrder implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderCreated $event): void
    {
        $order = $event->order;

        // استخراج فروشندگان یکتا از آیتم‌های سفارش
        $sellerIds = $order->items->pluck('seller_id')->filter()->unique();

        foreach ($sellerIds as $sellerId) {
            // TODO: در اینجا کد ارسال نوتیفیکیشن یا ایمیل به فروشنده قرار می‌گیرد
            // مثال: Notification::send($seller, new NewOrderNotification($order));

            Log::channel('daily')->info('Seller notified of new order', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'seller_id' => $sellerId,
            ]);
        }
    }
}