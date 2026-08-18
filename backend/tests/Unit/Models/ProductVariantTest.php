<?php

namespace Tests\Unit\Models;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Variant/Color System فاز ۲.۱ — پایه‌ی داده‌ای.
 *
 * این فایل رابطه‌ی دوطرفه‌ی Product<->ProductVariant و حفاظت در برابر
 * mass-assignment روی product_id را می‌سنجد (سناریوهای ۳ و ۱۷ از لیست
 * الزامی تست‌ها).
 */
class ProductVariantTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_has_many_variants(): void
    {
        $product = Product::factory()->create();

        $variantA = $product->variants()->create([
            'color_name' => 'مشکی',
            'sku' => 'REL-A-' . uniqid(),
            'price' => 100000,
            'stock' => 5,
        ]);
        $variantB = $product->variants()->create([
            'color_name' => 'سفید',
            'sku' => 'REL-B-' . uniqid(),
            'price' => 110000,
            'stock' => 3,
        ]);

        $fresh = $product->fresh()->load('variants');

        $this->assertCount(2, $fresh->variants);
        $this->assertTrue($fresh->variants->contains('id', $variantA->id));
        $this->assertTrue($fresh->variants->contains('id', $variantB->id));
    }

    public function test_variant_belongs_to_its_product(): void
    {
        $product = Product::factory()->create();
        $variant = $product->variants()->create([
            'color_name' => 'قرمز',
            'sku' => 'REL-C-' . uniqid(),
            'price' => 90000,
            'stock' => 1,
        ]);

        $loadedVariant = ProductVariant::find($variant->id);

        $this->assertInstanceOf(Product::class, $loadedVariant->product);
        $this->assertSame($product->id, $loadedVariant->product->id);
    }

    /**
     * ✅ دفاع IDOR در سطح مدل: product_id عمداً در $fillable نیست — تنها راه
     * مجاز تنظیم آن، متد رابطه‌ی $product->variants()->create() است، نه
     * دیتای خام کلاینت. این تست دقیقاً همان محافظت را می‌سنجد.
     */
    /**
     * ✅ محافظت حتی از silent-discard قوی‌تر است: چون Laravel در این
     * پروژه‌ی خاص preventSilentlyDiscardingAttributes فعال دارد (تست‌های
     * مشابه دیگر مدل‌ها هم همین رفتار را دارند)، هر تلاش برای mass-assign
     * یک ستون غیر-fillable (product_id) به‌جای نادیده‌گرفتن بی‌صدا، یک
     * MassAssignmentException صریح پرتاب می‌کند — یعنی حتی قوی‌تر از حداقل
     * انتظار امنیتی («نادیده گرفته شود»).
     */
    public function test_product_id_is_not_mass_assignable(): void
    {
        $otherProduct = Product::factory()->create();

        $this->expectException(\Illuminate\Database\Eloquent\MassAssignmentException::class);

        new ProductVariant([
            'product_id' => $otherProduct->id,
            'color_name' => 'آبی',
            'sku' => 'REL-D-' . uniqid(),
        ]);
    }

    /**
     * ✅ کشف واقعی حین نوشتن این تست: HasMany::create() هم داخلش از
     * newInstance($attributes) یعنی همان مسیر fill() عبور می‌کند — پس اگر
     * product_id در آرایه‌ی ورودی حضور داشته باشد، حتی از طریق متد رابطه
     * هم «نادیده گرفته» نمی‌شود، بلکه همان MassAssignmentException بلند و
     * صریح پرتاب می‌شود (نه سکوت، نه دورزدن ساکت). این دقیقاً همان دلیلی
     * است که SellerService::createProductVariants/syncProductVariants
     * قبل از فراخوانی ->create()، صراحتاً Arr::only($data,
     * VARIANT_FILLABLE_KEYS) می‌زند — یعنی product_id هرگز اصلاً به این
     * متد نمی‌رسد، نه اینکه به آن اعتماد شده باشد که relation آن را
     * بی‌صدا نادیده می‌گیرد.
     */
    public function test_relation_create_throws_if_caller_tries_to_pass_product_id_explicitly(): void
    {
        $realProduct = Product::factory()->create();
        $otherProduct = Product::factory()->create();

        $this->expectException(\Illuminate\Database\Eloquent\MassAssignmentException::class);

        $realProduct->variants()->create([
            'product_id' => $otherProduct->id,
            'color_name' => 'سبز',
            'sku' => 'REL-E-' . uniqid(),
        ]);
    }

    /**
     * مسیر واقعی و امنی که SellerService استفاده می‌کند: بدون product_id
     * در payload، رابطه خودش product_id درست را (همان $realProduct) ست
     * می‌کند.
     */
    public function test_relation_create_without_product_id_sets_it_from_the_owning_product(): void
    {
        $realProduct = Product::factory()->create();

        $created = $realProduct->variants()->create([
            'color_name' => 'سبز',
            'sku' => 'REL-E-' . uniqid(),
        ]);

        $this->assertSame($realProduct->id, $created->fresh()->product_id);
    }

    public function test_casts_apply_expected_types(): void
    {
        $product = Product::factory()->create();
        $variant = $product->variants()->create([
            'color_name' => 'زرد',
            'sku' => 'REL-F-' . uniqid(),
            'price' => 123456.7891,
            'stock' => 7,
            'attributes' => ['material' => 'چرم'],
        ]);

        $fresh = $variant->fresh();

        $this->assertIsInt($fresh->stock);
        $this->assertSame(7, $fresh->stock);
        $this->assertIsArray($fresh->attributes);
        $this->assertSame('چرم', $fresh->attributes['material']);
        $this->assertEquals(123456.7891, (float) $fresh->price);
    }
}
