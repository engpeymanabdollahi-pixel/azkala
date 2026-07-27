<?php

namespace App\Listeners;

use App\Events\Order\OrderCreated;
use Illuminate\Support\Facades\Log;

class SendOrderConfirmationSms
{
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