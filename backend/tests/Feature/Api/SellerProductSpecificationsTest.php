<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * فرم محصول فروشنده (ProductFormModal) یک قدم کامل «مشخصات فنی» دارد که
 * جفت‌های کلید/مقدار می‌گیرد، ولی specifications در قوانین اعتبارسنجی
 * store()/update() نبود — یعنی Request::validate() بی‌صدا حذفش می‌کرد، حتی
 * اگر فرانت‌اند می‌فرستادش. هرچه فروشنده در آن قدم تایپ می‌کرد، هیچ‌وقت
 * ذخیره نمی‌شد.
 */
class SellerProductSpecificationsTest extends TestCase
{
    use RefreshDatabase;

    protected User $seller;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seller = User::factory()->create(['role' => 'seller']);
        $this->category = Category::factory()->create();
    }

    public function test_specifications_are_saved_when_creating_a_product(): void
    {
        $payload = [
            'name' => 'قاب محافظ چرمی',
            'description' => 'یک قاب باکیفیت',
            'price' => 120000,
            'stock' => 20,
            'category_id' => $this->category->id,
            'specifications' => ['رنگ' => 'مشکی', 'جنس' => 'چرم طبیعی'],
        ];

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(201);

        $productId = $response->json('data.id');
        $product = Product::find($productId);

        $this->assertSame(['رنگ' => 'مشکی', 'جنس' => 'چرم طبیعی'], $product->specifications);
    }

    public function test_specifications_are_saved_when_updating_a_product(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->seller->id,
            'category_id' => $this->category->id,
            'specifications' => null,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$product->id}", [
                'specifications' => ['وزن' => '200 گرم'],
            ]);

        $response->assertStatus(200);

        $this->assertSame(['وزن' => '200 گرم'], $product->fresh()->specifications);
    }
}
