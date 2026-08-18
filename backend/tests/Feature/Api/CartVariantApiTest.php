<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Variant/Color System فاز ۳ — سبد خرید variant-aware، از مسیر HTTP واقعی
 * (POST/PUT/GET /api/v1/cart) که فرانت‌اند واقعاً با آن کار می‌کند.
 */
class CartVariantApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->category = Category::factory()->create();
    }

    public function test_user_can_add_variant_product_via_api(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 20]);
        $variant = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'CVA-BLK', 'price' => 105000, 'stock' => 5]);

        $response = $this->actingAs($this->user)->postJson('/api/v1/cart', [
            'product_id' => $product->id,
            'quantity' => 1,
            'variant_id' => $variant->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.variant_id', $variant->id)
            ->assertJsonPath('data.price', fn ($price) => (float) $price === 105000.0);
    }

    /**
     * سناریوی E: variant_id متعلق به یک محصول کاملاً دیگر — IDOR — باید رد شود.
     */
    public function test_variant_belonging_to_a_different_product_is_rejected_via_api(): void
    {
        $productA = Product::factory()->create(['category_id' => $this->category->id]);
        $variantOfA = $productA->variants()->create(['color_name' => 'مشکی', 'sku' => 'CVA-CROSS', 'price' => 100000, 'stock' => 5]);
        $productB = Product::factory()->create(['category_id' => $this->category->id]);

        $response = $this->actingAs($this->user)->postJson('/api/v1/cart', [
            'product_id' => $productB->id,
            'quantity' => 1,
            'variant_id' => $variantOfA->id,
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseMissing('cart_items', ['product_id' => $productB->id]);
    }

    /**
     * سناریوی G: کلاینت هیچ راهی برای فرستادن price ندارد — validate() اصلاً
     * چنین کلیدی را نمی‌پذیرد؛ حتی اگر بفرستد، نادیده گرفته می‌شود و قیمت
     * واقعی سرور (variant.price) ذخیره می‌شود.
     */
    public function test_client_supplied_price_is_ignored_and_server_variant_price_is_used(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 20]);
        $variant = $product->variants()->create(['color_name' => 'سفید', 'sku' => 'CVA-WHT', 'price' => 130000, 'stock' => 5]);

        $response = $this->actingAs($this->user)->postJson('/api/v1/cart', [
            'product_id' => $product->id,
            'quantity' => 1,
            'variant_id' => $variant->id,
            // ✅ تلاش برای دستکاری قیمت — باید کاملاً بی‌اثر باشد
            'price' => 1,
            'final_price' => 1,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'price' => 130000,
        ]);
    }

    /**
     * سناریوی C: دو رنگ مختلف از همان محصول باید دو ردیف جدا در پاسخ
     * GET /api/v1/cart تولید کنند.
     */
    public function test_different_colors_of_same_product_appear_as_separate_rows_in_cart_response(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 20]);
        $black = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'CVA-B1', 'price' => 100000, 'stock' => 5]);
        $white = $product->variants()->create(['color_name' => 'سفید', 'sku' => 'CVA-W1', 'price' => 100000, 'stock' => 5]);

        $this->actingAs($this->user)->postJson('/api/v1/cart', ['product_id' => $product->id, 'quantity' => 1, 'variant_id' => $black->id])->assertStatus(201);
        $this->actingAs($this->user)->postJson('/api/v1/cart', ['product_id' => $product->id, 'quantity' => 1, 'variant_id' => $white->id])->assertStatus(201);

        $response = $this->actingAs($this->user)->getJson('/api/v1/cart');
        $response->assertStatus(200);

        $items = $response->json('data.items');
        $this->assertCount(2, $items);

        // سناریوی H: پاسخ باید هر رنگ را به‌درستی شناسایی کند.
        $colors = collect($items)->pluck('variant.color_name')->sort()->values()->all();
        $this->assertEqualsCanonicalizing(['مشکی', 'سفید'], $colors);
    }

    /**
     * سناریوی D: افزودن دوباره‌ی همان رنگ باید تعداد را در همان ردیف
     * merge کند، نه یک ردیف جدید بسازد.
     */
    public function test_adding_the_same_variant_twice_merges_into_a_single_row_via_api(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 20]);
        $variant = $product->variants()->create(['color_name' => 'آبی', 'sku' => 'CVA-BLU2', 'price' => 100000, 'stock' => 20]);

        $this->actingAs($this->user)->postJson('/api/v1/cart', ['product_id' => $product->id, 'quantity' => 1, 'variant_id' => $variant->id])->assertStatus(201);
        $this->actingAs($this->user)->postJson('/api/v1/cart', ['product_id' => $product->id, 'quantity' => 2, 'variant_id' => $variant->id])->assertStatus(201);

        $response = $this->actingAs($this->user)->getJson('/api/v1/cart');
        $items = $response->json('data.items');

        $this->assertCount(1, $items);
        $this->assertSame(3, $items[0]['quantity']);
    }

    /**
     * سناریوی F (سطح API): moوجودی صفر یک variant باید با ۴۰۰ رد شود
     * (همان کد وضعیتی که OutOfStockException برای محصول ساده تولید
     * می‌کرد — رفتار یکسان، فقط علت فرق دارد).
     */
    public function test_zero_stock_variant_is_rejected_with_400_via_api(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);
        $variant = $product->variants()->create(['color_name' => 'نارنجی', 'sku' => 'CVA-ORG', 'price' => 100000, 'stock' => 0]);

        $response = $this->actingAs($this->user)->postJson('/api/v1/cart', [
            'product_id' => $product->id,
            'quantity' => 1,
            'variant_id' => $variant->id,
        ]);

        $response->assertStatus(400)->assertJsonPath('success', false);
    }

    // ==================== M: رگرسیون — legacy بدون variant ====================

    public function test_legacy_add_to_cart_without_variant_id_still_works_via_api(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 80000, 'stock' => 10]);

        $response = $this->actingAs($this->user)->postJson('/api/v1/cart', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(201)->assertJsonPath('data.variant_id', null);
    }

    /**
     * ✅ فاز ۳ (بند ۹، جلوگیری N+1): بارگذاری سبد با چند آیتم (چه با رنگ،
     * چه بدون) نباید تعداد کوئری‌ها را با تعداد آیتم‌ها رشد دهد.
     */
    public function test_cart_index_query_count_does_not_grow_with_number_of_items(): void
    {
        $countQueries = function (callable $call): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $call();
            $count = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $count;
        };

        $cart = Cart::create(['user_id' => $this->user->id]);
        $product = Product::factory()->create(['category_id' => $this->category->id]);
        $variant = $product->variants()->create(['color_name' => 'خاکستری', 'sku' => 'CVA-GRY', 'price' => 100000, 'stock' => 100]);

        CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1, 'price' => 100000]);

        // ✅ درخواست اول احراز‌هویت‌شده last_seen_at کاربر را هم آپدیت
        // می‌کند (یک کوئری اضافه‌ی یک‌باره، بی‌ربط به N+1 واقعی) —
        // دقیقاً همان الگوی ProductListQueryCountTest::test_my_products...
        // این warm-up قبل از اندازه‌گیری واقعی، آن اثر را خنثی می‌کند.
        $this->actingAs($this->user)->getJson('/api/v1/cart');

        $few = $countQueries(fn () => $this->actingAs($this->user)->getJson('/api/v1/cart')->assertStatus(200));

        for ($i = 0; $i < 10; $i++) {
            $p = Product::factory()->create(['category_id' => $this->category->id]);
            $v = $p->variants()->create(['color_name' => 'رنگ ' . $i, 'sku' => 'CVA-Q-' . $i, 'price' => 100000, 'stock' => 100]);
            CartItem::create(['cart_id' => $cart->id, 'product_id' => $p->id, 'variant_id' => $v->id, 'quantity' => 1, 'price' => 100000]);
        }
        $many = $countQueries(fn () => $this->actingAs($this->user)->getJson('/api/v1/cart')->assertStatus(200));

        $this->assertSame($few, $many, "GET /cart با {$few} کوئری برای ۱ آیتم ولی {$many} کوئری برای ۱۱ آیتم — یعنی variant/product به‌ازای هر ردیف lazy-load می‌شود.");
    }
}
