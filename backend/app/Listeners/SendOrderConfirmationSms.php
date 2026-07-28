<?php

namespace App\Listeners;

use App\Events\Order\OrderCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

// ✅ اضافه کردن implements ShouldQueue
class SendOrderConfirmationSms implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderCreated $event): void
    {
        $order = $event->order;

        // TODO: در اینجا کد واقعی ارسال پیامک (مثلاً با Kavenegar) قرار می‌گیرد
        // مثال: SmsService::send($order->user->phone, "سفارش {$order->order_number} با موفقیت ثبت شد.");

        Log::channel('daily')->info('SMS Confirmation queued for order', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'user_id' => $order->user_id,
        ]);
    }
}