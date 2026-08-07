<?php

namespace App\Listeners;

use App\Events\Order\OrderCreated;
use App\Models\User;
use App\Services\EmailService;
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
            $seller = User::find($sellerId);
            
            if (!$seller) {
                Log::warning('Seller not found for order notification', [
                    'seller_id' => $sellerId,
                    'order_id' => $order->id,
                ]);
                continue;
            }

            // ارسال ایمیل به فروشنده
            if ($seller->email) {
                EmailService::sendSellerNotification($seller->email, $order);
            }

            // ارسال پیامک به فروشنده (اختیاری)
            if ($seller->phone) {
                $message = "سفارش جدید: {$order->order_number}\nلطفاً برای بررسی وارد پنل شوید.";
                \App\Services\SmsService::send($seller->phone, $message);
            }

            Log::channel('daily')->info('Seller notified of new order', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'seller_id' => $sellerId,
                'seller_email' => $seller->email,
            ]);
        }
    }
}