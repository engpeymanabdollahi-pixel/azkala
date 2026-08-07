<?php

namespace App\Listeners;

use App\Events\Order\OrderCreated;
use App\Services\EmailService;
use App\Services\SmsService;
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
            // پیدا کردن فروشنده از طریق User model (فروشندگان User با role=seller هستند)
            $seller = \App\Models\User::find($sellerId);
            
            if (!$seller) {
                Log::warning('فروشنده یافت نشد', ['seller_id' => $sellerId]);
                continue;
            }

            // ارسال پیامک به فروشنده
            $smsMessage = sprintf(
                "سفارش جدید دریافت شد\nشماره سفارش: %s\nمبلغ: %s ریال\nازکالا",
                $order->order_number,
                number_format($order->total_amount)
            );

            if ($seller->phone) {
                SmsService::send($seller->phone, $smsMessage);
            }

            // ارسال ایمیل به فروشنده (در صورت وجود ایمیل)
            if ($seller->email) {
                $emailService = app(EmailService::class);
                $emailService->send(
                    $seller->email,
                    'سفارش جدید دریافت شد - #' . $order->order_number,
                    'emails.seller-new-order',
                    [
                        'seller' => $seller,
                        'order' => $order,
                        'orderNumber' => $order->order_number,
                        'items' => $order->items->where('seller_id', $sellerId),
                    ]
                );
            }

            Log::channel('daily')->info('Seller notified of new order', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'seller_id' => $sellerId,
                'seller_name' => $seller->name,
            ]);
        }
    }
}