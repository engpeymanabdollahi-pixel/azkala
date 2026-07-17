<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessOrderConfirmation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120; // حداکثر زمان اجرا (ثانیه)
    public $tries = 3;     // تعداد تلاش در صورت شکست

    public function __construct(
        public Order $order
    ) {}

    public function handle(): void
    {
        try {
            // ۱. ارسال ایمیل تأیید سفارش (مثال)
            // Mail::to($this->order->user->email)->send(new OrderConfirmedMail($this->order));

            // ۲. ارسال پیامک تأیید (مثال)
            // SmsService::send($this->order->shipping_address['phone'], "سفارش {$this->order->order_number} ثبت شد.");

            // ۳. به‌روزرسانی آمار فروش محصول (اختیاری)
            foreach ($this->order->items as $item) {
                // Log::info("Updating sales count for product: {$item->product_id}");
            }

            Log::info("Order confirmation processed successfully for order: {$this->order->order_number}");
            
        } catch (\Exception $e) {
            Log::error("Failed to process order confirmation for {$this->order->order_number}: " . $e->getMessage());
            throw $e; // باعث می‌شود Job دوباره تلاش کند (تا ۳ بار)
        }
    }
}