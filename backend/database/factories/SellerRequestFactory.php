<?php

namespace Database\Factories;

use App\Models\SellerRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SellerRequestFactory extends Factory
{
    protected $model = SellerRequest::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'shop_name' => fake()->company(),
            'national_code' => fake()->numerify('##########'),
            'phone' => fake()->phoneNumber(),
            'description' => fake()->sentence(),
            'id_card_image' => null,
            'business_license' => null,
            'business_license_image' => null,
            'bank_account' => null,
            'bank_name' => null,
            'shop_alias' => null,
            // ✅ قبلاً پیش‌فرض 'pending' بود — مقداری که هیچ‌وقت در جریان
            // واقعی ۴مرحله‌ای رخ نمی‌دهد (رجوع به کامنت‌های AdminUserService).
            // pending_initial واقعاً اولین وضعیت واقعیِ یک درخواست تازه است.
            'status' => 'pending_initial',
            'rejection_reason' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }

    public function pendingInitial(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_initial',
        ]);
    }

    public function pendingDocuments(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_documents',
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function pendingFinal(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_final',
            'bank_account' => 'IR' . fake()->numerify('##########################'),
            'id_card_image' => 'seller_docs/id_cards/fake.jpg',
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'bank_account' => 'IR' . fake()->numerify('##########################'),
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejection_reason' => fake()->sentence(),
            'reviewed_by' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }
}
