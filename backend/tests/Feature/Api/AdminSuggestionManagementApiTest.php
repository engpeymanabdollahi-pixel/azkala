<?php

namespace Tests\Feature\Api;

use App\Models\Conversation;
use App\Models\Product;
use App\Models\ProductSuggestion;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSuggestionManagementApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    protected function makeSuggestion(array $overrides = []): ProductSuggestion
    {
        $conversation = Conversation::factory()->create();
        $product = Product::factory()->create();

        return ProductSuggestion::create(array_merge([
            'conversation_id' => $conversation->id,
            'product_id' => $product->id,
            'suggested_by' => $conversation->seller_id,
            'source' => 'auto',
            'relevance_score' => 0.8,
            'is_clicked' => false,
            'is_purchased' => false,
        ], $overrides));
    }

    public function test_admin_can_get_suggestion_stats(): void
    {
        $this->makeSuggestion(['is_clicked' => true, 'is_purchased' => true]);
        $this->makeSuggestion();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/chat-management/suggestions/stats');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.clicked', 1)
            ->assertJsonPath('data.purchased', 1)
            ->assertJsonCount(7, 'data.trend');
    }

    public function test_admin_can_list_suggestions(): void
    {
        $this->makeSuggestion();
        $this->makeSuggestion(['source' => 'manual']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/chat-management/suggestions');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.suggestions');
    }

    /**
     * ✅ قبلاً getSettings() همیشه همان مقادیر پیش‌فرض ثابت را برمی‌گرداند و
     * هیچ‌وقت از جدول settings نمی‌خواند، در حالی که updateSettings() مقادیر
     * را واقعاً با کلید suggestion_{key} ذخیره می‌کرد — یعنی تنظیمات ذخیره
     * می‌شد ولی بعد از رفرش صفحه هیچ‌وقت به فرانت‌اند برنمی‌گشت.
     */
    public function test_updated_settings_are_actually_returned_by_get_settings(): void
    {
        $update = $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/chat-management/suggestions/settings', [
                'max_suggestions_per_conversation' => 8,
                'min_relevance_score' => 0.3,
                'prioritize_same_category' => false,
                'prioritize_top_selling' => true,
                'prioritize_new_products' => true,
                'auto_suggest_enabled' => false,
                'manual_suggest_enabled' => true,
            ]);
        $update->assertStatus(200)->assertJsonPath('success', true);

        $this->assertDatabaseHas('settings', [
            'key' => 'suggestion_max_suggestions_per_conversation',
            'value' => '8',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/chat-management/suggestions/settings');

        $response->assertStatus(200)
            ->assertJsonPath('data.max_suggestions_per_conversation', 8)
            ->assertJsonPath('data.min_relevance_score', 0.3)
            ->assertJsonPath('data.prioritize_same_category', false)
            ->assertJsonPath('data.prioritize_new_products', true)
            ->assertJsonPath('data.auto_suggest_enabled', false);
    }

    public function test_get_settings_falls_back_to_defaults_when_nothing_saved_yet(): void
    {
        $this->assertSame(0, Setting::count());

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/chat-management/suggestions/settings');

        $response->assertStatus(200)
            ->assertJsonPath('data.max_suggestions_per_conversation', 5)
            ->assertJsonPath('data.auto_suggest_enabled', true);
    }
}
