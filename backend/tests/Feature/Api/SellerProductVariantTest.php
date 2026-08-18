<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Variant/Color System فاز ۲.۱ + ۲.۲ — مدیریت رنگ توسط فروشنده.
 *
 * پوشش سناریوهای ۴ تا ۲۰ از لیست الزامی تست‌ها (به‌جز ۱۹/۲۰ که در واقع
 * «مجموعه‌ی رگرسیون موجود بدون تغییر پاس می‌شود» است و در فاز verification
 * نهایی با اجرای کل test suite سنجیده می‌شود، نه یک تست جدید مجزا).
 */
class SellerProductVariantTest extends TestCase
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

    private function basePayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'کاور محافظ رنگی',
            'description' => 'یک کاور با چند رنگ',
            'price' => 200000,
            'stock' => 30,
            'category_id' => $this->category->id,
        ], $overrides);
    }

    // ==================== سناریو ۴: ایجاد ====================

    public function test_seller_can_create_variants_for_own_product(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'CRT-BLK', 'price' => 210000, 'stock' => 10],
                ['color_name' => 'سفید', 'sku' => 'CRT-WHT', 'price' => 205000, 'stock' => 4],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(201);

        $productId = $response->json('data.id');
        $product = Product::find($productId);

        $this->assertCount(2, $product->variants);
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $productId, 'sku' => 'CRT-BLK', 'color_name' => 'مشکی',
        ]);
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $productId, 'sku' => 'CRT-WHT', 'color_name' => 'سفید',
        ]);

        // پاسخ create هم باید فوراً variants را برگرداند (بدون نیاز به رفرش جدا)
        $this->assertCount(2, $response->json('data.variants'));
    }

    /**
     * سناریوی ۱۴ (بخش create): create بدون کلید variants دقیقاً همان رفتار
     * قبلی — محصول ساده بدون رنگ، بدون خطا.
     */
    public function test_creating_product_without_variants_key_still_works_exactly_as_before(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $this->basePayload());

        $response->assertStatus(201);

        $product = Product::find($response->json('data.id'));
        $this->assertCount(0, $product->variants);
        $this->assertSame(200000.0, (float) $product->price);
    }

    // ==================== سناریو ۵: بروزرسانی رنگ خودش ====================

    public function test_seller_can_update_own_variant(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->seller->id, 'category_id' => $this->category->id,
        ]);
        $variant = $product->variants()->create([
            'color_name' => 'مشکی', 'sku' => 'UPD-1', 'price' => 100000, 'stock' => 5,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$product->id}", [
                'variants' => [
                    ['id' => $variant->id, 'color_name' => 'مشکی', 'sku' => 'UPD-1', 'price' => 150000, 'stock' => 9],
                ],
            ]);

        $response->assertStatus(200);

        $variant->refresh();
        $this->assertEquals(150000, (float) $variant->price);
        $this->assertSame(9, $variant->stock);
    }

    // ==================== سناریو ۶: حذف رنگ خودش ====================

    /**
     * قانون معماری این فاز: حذف فقط از طریق «همگام‌سازی کامل» رخ می‌دهد —
     * وقتی variants[] ارسال شود ولی یک id قبلی در آن نباشد، آن رنگ soft-
     * delete می‌شود.
     */
    public function test_seller_can_delete_own_variant_via_full_replacement_sync(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->seller->id, 'category_id' => $this->category->id,
        ]);
        $keep = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'DEL-KEEP', 'price' => 100000, 'stock' => 1]);
        $remove = $product->variants()->create(['color_name' => 'سفید', 'sku' => 'DEL-REMOVE', 'price' => 110000, 'stock' => 2]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$product->id}", [
                'variants' => [
                    ['id' => $keep->id, 'color_name' => 'مشکی', 'sku' => 'DEL-KEEP', 'price' => 100000, 'stock' => 1],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertNotSoftDeleted('product_variants', ['id' => $keep->id]);
        $this->assertSoftDeleted('product_variants', ['id' => $remove->id]);
    }

    /**
     * سناریوی ۱۴ (بخش حیاتی): عدم ارسال کلید variants یعنی «دست‌نخورده
     * بماند»، نه «همه حذف شوند».
     */
    public function test_omitting_variants_key_on_update_leaves_existing_variants_untouched(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->seller->id, 'category_id' => $this->category->id,
        ]);
        $variant = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'KEEP-1', 'price' => 100000, 'stock' => 1]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$product->id}", [
                'name' => 'فقط تغییر نام، بدون variants',
            ]);

        $response->assertStatus(200);

        $this->assertNotSoftDeleted('product_variants', ['id' => $variant->id]);
        $this->assertCount(1, $product->fresh()->variants);
    }

    // ==================== سناریو ۷/۸/۹: IDOR ====================

    public function test_seller_cannot_update_another_sellers_product_or_its_variants(): void
    {
        $otherSeller = User::factory()->create(['role' => 'seller']);
        $product = Product::factory()->create(['seller_id' => $otherSeller->id, 'category_id' => $this->category->id]);
        $variant = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'IDOR-1', 'price' => 100000, 'stock' => 1]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$product->id}", [
                'variants' => [
                    ['id' => $variant->id, 'color_name' => 'دستکاری‌شده', 'price' => 1, 'stock' => 999],
                ],
            ]);

        $response->assertStatus(403);

        $variant->refresh();
        $this->assertSame('مشکی', $variant->color_name);
        $this->assertEquals(100000, (float) $variant->price);
    }

    /**
     * حتی اگر فروشنده صاحب محصول مقصد باشد، نباید بتواند id یک variant
     * متعلق به محصول *دیگر* (حتی محصول دیگرِ خودش) را به این محصول بچسباند.
     */
    public function test_seller_cannot_attach_a_variant_id_belonging_to_a_different_product_of_their_own(): void
    {
        $productA = Product::factory()->create(['seller_id' => $this->seller->id, 'category_id' => $this->category->id]);
        $productB = Product::factory()->create(['seller_id' => $this->seller->id, 'category_id' => $this->category->id]);
        $variantOfA = $productA->variants()->create(['color_name' => 'مشکی', 'sku' => 'CROSS-A', 'price' => 100000, 'stock' => 1]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$productB->id}", [
                'variants' => [
                    ['id' => $variantOfA->id, 'color_name' => 'دزدیده‌شده', 'price' => 1, 'stock' => 1],
                ],
            ]);

        $response->assertStatus(422);

        $variantOfA->refresh();
        $this->assertSame('مشکی', $variantOfA->color_name);
        $this->assertSame($productA->id, $variantOfA->product_id);
    }

    /**
     * سناریوی ۹ (نسخه‌ی cross-seller): تلاش برای چسباندن id یک variant
     * متعلق به فروشنده‌ی دیگر، به محصول خودِ این فروشنده.
     */
    public function test_seller_cannot_attach_a_variant_id_belonging_to_another_sellers_product(): void
    {
        $otherSeller = User::factory()->create(['role' => 'seller']);
        $otherProduct = Product::factory()->create(['seller_id' => $otherSeller->id, 'category_id' => $this->category->id]);
        $otherVariant = $otherProduct->variants()->create(['color_name' => 'مشکی', 'sku' => 'OTHER-SELLER-1', 'price' => 100000, 'stock' => 1]);

        $ownProduct = Product::factory()->create(['seller_id' => $this->seller->id, 'category_id' => $this->category->id]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$ownProduct->id}", [
                'variants' => [
                    ['id' => $otherVariant->id, 'color_name' => 'دزدیده‌شده', 'price' => 1, 'stock' => 1],
                ],
            ]);

        $response->assertStatus(422);

        $otherVariant->refresh();
        $this->assertSame($otherProduct->id, $otherVariant->product_id);
        $this->assertSame('مشکی', $otherVariant->color_name);
    }

    // ==================== سناریو ۱۰/۱۱: قیمت/موجودی مستقل ====================

    public function test_different_variants_can_have_different_prices_and_stock(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'PS-1', 'price' => 300000, 'stock' => 50],
                ['color_name' => 'قرمز', 'sku' => 'PS-2', 'price' => 350000, 'stock' => 2],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(201);

        $product = Product::find($response->json('data.id'));
        $black = $product->variants()->where('sku', 'PS-1')->first();
        $red = $product->variants()->where('sku', 'PS-2')->first();

        $this->assertNotEquals((float) $black->price, (float) $red->price);
        $this->assertNotEquals($black->stock, $red->stock);
    }

    // ==================== سناریو ۱۲: موجودی منفی رد شود ====================

    public function test_negative_variant_stock_is_rejected(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'NEG-STOCK', 'price' => 100000, 'stock' => -5],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['variants.0.stock']);

        $this->assertDatabaseMissing('product_variants', ['sku' => 'NEG-STOCK']);
    }

    // ==================== سناریو ۱۳: قیمت نامعتبر رد شود ====================

    public function test_negative_variant_price_is_rejected(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'NEG-PRICE', 'price' => -100, 'stock' => 5],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['variants.0.price']);

        $this->assertDatabaseMissing('product_variants', ['sku' => 'NEG-PRICE']);
    }

    /**
     * تکراری بودن SKU داخل همان درخواست هم باید رد شود (قانون global-unique
     * موجود روی products.sku اینجا هم روی product_variants.sku رعایت شده).
     */
    public function test_duplicate_sku_within_the_same_request_is_rejected(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'DUP-SKU', 'price' => 100000, 'stock' => 1],
                ['color_name' => 'سفید', 'sku' => 'DUP-SKU', 'price' => 100000, 'stock' => 1],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['variants']);

        $this->assertDatabaseMissing('product_variants', ['sku' => 'DUP-SKU']);
    }

    // ==================== سناریو ۱۶: rollback تراکنشی ====================

    /**
     * ✅ بحرانی: اگر variant دوم به‌خاطر SKU تکراری با یک رکورد از‌قبل
     * موجود در دیتابیس (نه داخل همین درخواست) رد شود، کل عملیات — از جمله
     * variant اول که با موفقیت ساخته شده بود، و حتی خودِ محصول — باید
     * rollback شود؛ نباید نیمه‌کاره در دیتابیس بماند.
     */
    public function test_transaction_rolls_back_completely_when_a_later_variant_fails_global_sku_uniqueness(): void
    {
        // یک SKU از‌قبل، متعلق به محصولی کاملاً نامرتبط
        $unrelatedProduct = Product::factory()->create(['category_id' => $this->category->id]);
        $unrelatedProduct->variants()->create([
            'color_name' => 'قدیمی', 'sku' => 'ALREADY-TAKEN', 'price' => 1, 'stock' => 1,
        ]);

        $payload = $this->basePayload([
            'name' => 'محصول rollback',
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'ROLLBACK-FIRST', 'price' => 100000, 'stock' => 1],
                ['color_name' => 'سفید', 'sku' => 'ALREADY-TAKEN', 'price' => 100000, 'stock' => 1],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(422);

        // نه محصول ساخته شد، نه variant اول
        $this->assertDatabaseMissing('products', ['name' => 'محصول rollback']);
        $this->assertDatabaseMissing('product_variants', ['sku' => 'ROLLBACK-FIRST']);
    }

    /**
     * همان سناریوی rollback، ولی روی مسیر update (سناریوی sync).
     */
    public function test_transaction_rolls_back_on_update_when_sync_fails_partway(): void
    {
        $unrelatedProduct = Product::factory()->create(['category_id' => $this->category->id]);
        $unrelatedProduct->variants()->create([
            'color_name' => 'قدیمی', 'sku' => 'UPDATE-TAKEN', 'price' => 1, 'stock' => 1,
        ]);

        $product = Product::factory()->create([
            'seller_id' => $this->seller->id, 'category_id' => $this->category->id, 'name' => 'قبل از آپدیت',
        ]);
        $existingVariant = $product->variants()->create([
            'color_name' => 'مشکی', 'sku' => 'UPDATE-KEEP', 'price' => 100000, 'stock' => 1,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/v1/seller/products/{$product->id}", [
                'name' => 'بعد از آپدیت (نباید اعمال شود)',
                'variants' => [
                    ['id' => $existingVariant->id, 'color_name' => 'مشکی', 'sku' => 'UPDATE-KEEP', 'price' => 999999, 'stock' => 1],
                    ['color_name' => 'جدید', 'sku' => 'UPDATE-TAKEN', 'price' => 100000, 'stock' => 1],
                ],
            ]);

        $response->assertStatus(422);

        $product->refresh();
        $existingVariant->refresh();

        // نه نام محصول تغییر کرد، نه قیمت variant موجود
        $this->assertSame('قبل از آپدیت', $product->name);
        $this->assertEquals(100000, (float) $existingVariant->price);
    }

    // ==================== سناریو ۱۷: mass-assignment ====================

    /**
     * ارسال product_id در payload یک variant هرگز نباید به مقدار واقعی
     * ستون product_id راه پیدا کند — چه validate() آن را حذف کند (چون در
     * قوانین نیست)، چه SellerService::VARIANT_FILLABLE_KEYS آن را فیلتر
     * کند. اینجا فقط نتیجه‌ی نهایی سنجیده می‌شود: variant متعلق به همان
     * محصولی است که از طریق آن ساخته شده، نه چیزی که در بدنه‌ی درخواست آمده.
     */
    public function test_client_supplied_product_id_in_variant_payload_is_ignored(): void
    {
        $otherProduct = Product::factory()->create(['category_id' => $this->category->id]);

        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'MASS-1', 'price' => 100000, 'stock' => 1, 'product_id' => $otherProduct->id],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(201);

        $createdProductId = $response->json('data.id');
        $variant = ProductVariant::where('sku', 'MASS-1')->first();

        $this->assertNotNull($variant);
        $this->assertSame($createdProductId, $variant->product_id);
        $this->assertNotEquals($otherProduct->id, $variant->product_id);
    }

    // ==================== سناریو ۱۸: اعتبارسنجی JSON بودن attributes ====================

    public function test_variant_attributes_must_be_an_array(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'ATTR-1', 'price' => 100000, 'stock' => 1, 'attributes' => 'not-an-array'],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['variants.0.attributes']);
    }

    public function test_variant_attributes_are_stored_and_returned_as_array_when_valid(): void
    {
        $payload = $this->basePayload([
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'ATTR-2', 'price' => 100000, 'stock' => 1, 'attributes' => ['material' => 'چرم', 'size' => 'M']],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(201);

        $variant = ProductVariant::where('sku', 'ATTR-2')->first();
        $this->assertIsArray($variant->attributes);
        $this->assertSame('چرم', $variant->attributes['material']);
    }

    // ==================== سناریو ۱۴ (تکمیلی): رگرسیون کامل بدون variant ====================

    /**
     * فرم فروشنده‌ی موجود پیش از این فاز هم device_model_ids می‌فرستد، هم
     * specifications — این تست تضمین می‌کند که کنار هم گذاشتنشان با
     * variants باعث تداخل نمی‌شود (نه یکی دیگری را حذف کند، نه اعتبارسنجی
     * یکی مانع دیگری شود).
     */
    public function test_variants_coexist_with_specifications_and_device_model_ids_without_interference(): void
    {
        $payload = $this->basePayload([
            'specifications' => ['رنگ پایه' => 'چند رنگ'],
            'variants' => [
                ['color_name' => 'مشکی', 'sku' => 'COEXIST-1', 'price' => 100000, 'stock' => 1],
            ],
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson('/api/v1/seller/products', $payload);

        $response->assertStatus(201);

        $product = Product::find($response->json('data.id'));
        $this->assertSame(['رنگ پایه' => 'چند رنگ'], $product->specifications);
        $this->assertCount(1, $product->variants);
    }
}
