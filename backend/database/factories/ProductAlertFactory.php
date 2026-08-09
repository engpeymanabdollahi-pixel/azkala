<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductAlert;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductAlert>
 */
class ProductAlertFactory extends Factory
{
    protected $model = ProductAlert::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $product = Product::factory()->create(['price' => 1000000]);
        $finalPrice = $product->discount_price ?? $product->price;

        return [
            'user_id' => User::factory(),
            'product_id' => $product->id,
            'type' => $this->faker->randomElement([
                ProductAlert::TYPE_RESTOCK,
                ProductAlert::TYPE_PRICE_DROP,
                ProductAlert::TYPE_TARGET_PRICE,
            ]),
            'target_price' => null,
            'discount_percentage' => null,
            'original_price' => $finalPrice,
            'is_active' => true,
            'is_triggered' => false,
            'triggered_at' => null,
            'channels' => ['database', 'email'],
        ];
    }

    // ==================== States ====================

    /**
     * Alert از نوع Restock (موجودی)
     */
    public function restock(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => ProductAlert::TYPE_RESTOCK,
                'target_price' => null,
                'discount_percentage' => null,
            ];
        });
    }

    /**
     * Alert از نوع Price Drop با درصد خاص
     */
    public function priceDrop(int $percentage = 10): static
    {
        return $this->state(function (array $attributes) use ($percentage) {
            return [
                'type' => ProductAlert::TYPE_PRICE_DROP,
                'discount_percentage' => $percentage,
                'target_price' => null,
            ];
        });
    }

    /**
     * Alert از نوع Target Price
     */
    public function targetPrice(float $targetPrice): static
    {
        return $this->state(function (array $attributes) use ($targetPrice) {
            return [
                'type' => ProductAlert::TYPE_TARGET_PRICE,
                'target_price' => $targetPrice,
                'discount_percentage' => null,
            ];
        });
    }

    /**
     * Alert فعال (پیش‌فرض)
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'is_triggered' => false,
        ]);
    }

    /**
     * Alert غیرفعال
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Alert trigger شده
     */
    public function triggered(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_triggered' => true,
            'triggered_at' => now(),
            'is_active' => false,
        ]);
    }

    /**
     * Alert آماده پردازش (active و not triggered)
     */
    public function pending(): static
    {
        return $this->active();
    }

    /**
     * برای کاربر خاص
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * برای محصول خاص
     */
    public function forProduct(Product $product): static
    {
        $finalPrice = $product->discount_price ?? $product->price;
        
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
            'original_price' => $finalPrice,
        ]);
    }

    /**
     * فقط database channel (برای تست سریع‌تر)
     */
    public function databaseOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'channels' => ['database'],
        ]);
    }
}