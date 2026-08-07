<?php

namespace App\Listeners;

use App\Events\Order\OrderCreated;
use App\Services\SmsService;
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

        // ارسال پیامک تأیید سفارش به مشتری
        $message = sprintf(
            "سفارش شما با شماره %s با موفقیت ثبت شد.\nمبلغ کل: %s ریال\nازکالا",
            $order->order_number,
            number_format($order->total_amount)
        );

        if ($order->user && $order->user->phone) {
            SmsService::send($order->user->phone, $message);
        }

        Log::channel('daily')->info('SMS Confirmation queued for order', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'user_id' => $order->user_id,
        ]);
    }
}