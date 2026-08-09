<?php

namespace App\Jobs;

use App\Models\Product;
use App\Services\AlertService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessPriceDropAlertsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 3;

    public function __construct(
        public Product $product
    ) {}

    public function handle(AlertService $alertService): void
    {
        try {
            $processed = $alertService->processPriceAlerts($this->product);

            Log::info("Price alerts processed", [
                'product_id' => $this->product->id,
                'processed' => $processed,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process price alerts for product {$this->product->id}: " . $e->getMessage());
            throw $e;
        }
    }
}