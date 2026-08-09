<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductAlert;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AlertService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Create a new alert for user
     */
    public function createAlert(User $user, array $data): ProductAlert
{
    $product = Product::findOrFail($data['product_id']);
    $finalPrice = $product->discount_price ?? $product->price;

    // Check for duplicate active alert (same user + product + type)
    $existing = $user->alerts()
        ->where('product_id', $data['product_id'])
        ->where('type', $data['type'])
        ->where('is_active', true)
        ->first();

    if ($existing) {
        throw new \Exception('شما قبلاً برای این محصول هشدار فعال دارید', 409);
    }

   return $user->alerts()->create([
    'product_id' => $data['product_id'],
    'type' => $data['type'],
    'target_price' => $data['target_price'] ?? null,
    'discount_percentage' => $data['discount_percentage'] ?? null,
    'original_price' => $finalPrice,
    'is_active' => true,
    'is_triggered' => false,
    'channels' => $data['channels'] ?? ProductAlert::DEFAULT_CHANNELS,
]);
}

    /**
     * Process restock alerts for a product
     */
    public function processRestockAlerts(Product $product): int
    {
        $alerts = ProductAlert::pending()
            ->restock()
            ->forProduct($product->id)
            ->with(['user', 'product'])
            ->get();

        $processed = 0;

        foreach ($alerts as $alert) {
            try {
                if ($alert->isConditionMet($product)) {
                    $this->notifyUser($alert, $product);
                    $alert->markAsTriggered();
                    $processed++;

                    Log::info("Restock alert triggered", [
                        'alert_id' => $alert->id,
                        'user_id' => $alert->user_id,
                        'product_id' => $product->id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Failed to process restock alert {$alert->id}: " . $e->getMessage());
            }
        }

        return $processed;
    }

    /**
     * Process price alerts for a product (price_drop + target_price)
     */
    public function processPriceAlerts(Product $product): int
    {
        $alerts = ProductAlert::pending()
            ->forProduct($product->id)
            ->whereIn('type', [ProductAlert::TYPE_PRICE_DROP, ProductAlert::TYPE_TARGET_PRICE])
            ->with(['user', 'product'])
            ->get();

        $processed = 0;

        foreach ($alerts as $alert) {
            try {
                if ($alert->isConditionMet($product)) {
                    $this->notifyUser($alert, $product);
                    $alert->markAsTriggered();
                    $processed++;

                    Log::info("Price alert triggered", [
                        'alert_id' => $alert->id,
                        'type' => $alert->type,
                        'user_id' => $alert->user_id,
                        'product_id' => $product->id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Failed to process price alert {$alert->id}: " . $e->getMessage());
            }
        }

        return $processed;
    }

    /**
     * Notify user via database channel
     */
    private function notifyUser(ProductAlert $alert, Product $product): void
    {
        $channels = $alert->channels ?? ['database'];

        // Database notification via existing NotificationService
        if (in_array('database', $channels)) {
            $this->notificationService->create([
                'user_id' => $alert->user_id,
                'type' => 'product_alert',
                'title' => $alert->getMessage(),
                'message' => $this->buildNotificationMessage($alert, $product),
            ]);
        }

        // Email channel - TODO: نیاز به Blade view دارد، فعلاً لاگ می‌شود
        if (in_array('email', $channels)) {
            Log::info("Email alert skipped (view not ready)", [
                'alert_id' => $alert->id,
                'email' => $alert->user->email ?? 'N/A',
            ]);
        }
    }

    /**
     * Build detailed notification message
     */
    private function buildNotificationMessage(ProductAlert $alert, Product $product): string
    {
        $finalPrice = $product->discount_price ?? $product->price;
        $priceText = number_format($finalPrice) . ' تومان';

        return match($alert->type) {
            ProductAlert::TYPE_RESTOCK => "محصول «{$product->name}» هم‌اکنون موجود است. قیمت: {$priceText}",
            ProductAlert::TYPE_PRICE_DROP => "قیمت «{$product->name}» به {$priceText} کاهش یافت. از قیمت اصلی " . number_format($alert->original_price) . " تومان.",
            ProductAlert::TYPE_TARGET_PRICE => "قیمت «{$product->name}» به {$priceText} رسید (محدوده دلخواه شما: " . number_format($alert->target_price) . " تومان).",
            default => 'هشدار محصول',
        };
    }
}