<?php

namespace Tests\Unit\Services;

use App\Exceptions\OutOfStockException;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Variant/Color System فاز ۳ — سبد خرید variant-aware.
 *
 * سناریوهای A-G از لیست الزامی فاز ۳ در سطح Service (بدون HTTP)، مکمل
 * CartVariantApiTest که همان سناریوها را از مسیر HTTP واقعی می‌سنجد.
 */
class CartServiceVariantTest extends TestCase
{
    use RefreshDatabase;

    protected CartService $service;

    protected User $user;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CartService();
        $this->user = User::factory()->create();
        $this->category = Category::factory()->create();
    }

    // ==================== A: محصول legacy ====================

    public function test_legacy_product_without_variant_can_still_be_added_to_cart(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 10]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $item = $this->service->addItem($cart, $product->id, 2);

        $this->assertNull($item->variant_id);
        $this->assertEquals(2, $item->quantity);
        $this->assertEquals(100000, (float) $item->price);
    }

    // ==================== B: محصول با variant ====================

    public function test_product_with_variant_can_be_added_with_variant_id(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 10]);
        $variant = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'CSV-BLK', 'price' => 120000, 'stock' => 5]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $item = $this->service->addItem($cart, $product->id, 1, null, $variant->id);

        $this->assertSame($variant->id, $item->variant_id);
        $this->assertEquals(120000, (float) $item->price);
    }

    // ==================== C: رنگ متفاوت = آیتم جدا ====================

    public function test_different_variant_of_same_product_creates_a_separate_cart_item(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 50]);
        $black = $product->variants()->create(['color_name' => 'مشکی', 'sku' => 'CSV-BLK-2', 'price' => 110000, 'stock' => 10]);
        $white = $product->variants()->create(['color_name' => 'سفید', 'sku' => 'CSV-WHT-2', 'price' => 115000, 'stock' => 10]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $itemBlack = $this->service->addItem($cart, $product->id, 1, null, $black->id);
        $itemWhite = $this->service->addItem($cart, $product->id, 1, null, $white->id);

        $this->assertNotEquals($itemBlack->id, $itemWhite->id);
        $this->assertSame(2, $cart->items()->count());
    }

    // ==================== D: همان رنگ = merge تعداد ====================

    public function test_same_variant_added_twice_merges_quantity_into_one_row(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 100000, 'stock' => 50]);
        $variant = $product->variants()->create(['color_name' => 'آبی', 'sku' => 'CSV-BLU', 'price' => 100000, 'stock' => 20]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $first = $this->service->addItem($cart, $product->id, 1, null, $variant->id);
        $second = $this->service->addItem($cart, $product->id, 2, null, $variant->id);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(3, $second->fresh()->quantity);
        $this->assertSame(1, $cart->items()->count());
    }

    // ==================== E: variant متعلق به محصول دیگر ====================

    public function test_variant_belonging_to_another_product_is_rejected(): void
    {
        $productA = Product::factory()->create(['category_id' => $this->category->id]);
        $variantOfA = $productA->variants()->create(['color_name' => 'مشکی', 'sku' => 'CSV-CROSS', 'price' => 100000, 'stock' => 5]);
        $productB = Product::factory()->create(['category_id' => $this->category->id]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $this->expectException(\InvalidArgumentException::class);
        $this->service->addItem($cart, $productB->id, 1, null, $variantOfA->id);
    }

    // ==================== F: موجودی ====================

    public function test_variant_with_zero_stock_cannot_be_added(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);
        $variant = $product->variants()->create(['color_name' => 'قرمز', 'sku' => 'CSV-RED', 'price' => 100000, 'stock' => 0]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $this->expectException(OutOfStockException::class);
        $this->service->addItem($cart, $product->id, 1, null, $variant->id);
    }

    public function test_quantity_exceeding_variant_stock_is_rejected(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);
        $variant = $product->variants()->create(['color_name' => 'سبز', 'sku' => 'CSV-GRN', 'price' => 100000, 'stock' => 3]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $this->expectException(OutOfStockException::class);
        $this->service->addItem($cart, $product->id, 4, null, $variant->id);
    }

    /**
     * ✅ محصول با variant انتخاب‌شده باید فقط موجودی همان variant را
     * بسنجد، نه Product.stock کلی — حتی اگر Product.stock خیلی بیشتر
     * باشد.
     */
    public function test_variant_stock_check_is_independent_of_product_level_stock(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'stock' => 1000]);
        $variant = $product->variants()->create(['color_name' => 'بنفش', 'sku' => 'CSV-PUR', 'price' => 100000, 'stock' => 2]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $this->expectException(OutOfStockException::class);
        $this->service->addItem($cart, $product->id, 3, null, $variant->id);
    }

    // ==================== G: قیمت مرجع سرور ====================

    public function test_cart_snapshot_price_uses_variant_final_price_including_discount(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'price' => 200000]);
        $variant = $product->variants()->create([
            'color_name' => 'طلایی', 'sku' => 'CSV-GLD', 'price' => 250000, 'discount_price' => 190000, 'stock' => 5,
        ]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $item = $this->service->addItem($cart, $product->id, 1, null, $variant->id);

        // final_price = discount_price ?? price = 190000، نه 250000 خام و نه
        // چیزی که کلاینت بفرستد (این متد اصلاً چنین پارامتری نمی‌گیرد).
        $this->assertEquals(190000, (float) $item->price);
    }

    // ==================== Legacy regression ====================

    public function test_legacy_stock_check_still_uses_product_stock_when_no_variant_selected(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id, 'stock' => 2]);
        $cart = $this->service->getOrCreateCart($this->user->id);

        $this->expectException(OutOfStockException::class);
        $this->service->addItem($cart, $product->id, 5);
    }
}
