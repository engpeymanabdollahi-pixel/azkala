<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    // ✅ Variant/Color System فاز ۲.۱: allow-list سخت‌گیرانه — طبق قانون
    // صریح تسک، product_id عمداً اینجا نیست: هیچ mutation ای اجازه ندارد
    // product_id یک variant را از payload کلاینت تعیین کند (خطر IDOR اگر
    // یک فروشنده بتواند variant را به محصول فروشنده‌ی دیگر بچسباند).
    // تنها مسیر مجاز نوشتن product_id، رابطه‌ی $product->variants()
    // است (در SellerService، بعد از احراز مالکیت محصول).
    protected $fillable = [
        'color_name',
        'color_code',
        'sku',
        'price',
        'compare_price',
        'discount_price',
        'stock',
        'image',
        'attributes',
    ];

    protected $casts = [
        'price' => 'decimal:4',
        'compare_price' => 'decimal:4',
        'discount_price' => 'decimal:4',
        'stock' => 'integer',
        'attributes' => 'array',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ✅ Variant/Color System فاز ۳: دقیقاً همان قرارداد
    // Product::getFinalPriceAttribute() — «قیمتی که واقعاً پرداخت می‌شود»
    // discount_price (اگر ست شده) وگرنه price خام است. compare_price فقط
    // یک قیمت مرجع/خط‌خورده برای نمایش تخفیف است، نه قیمت نهایی. این
    // accessor از فاز ۲.۱ وجود نداشت چون تا این فاز هیچ مصرف‌کننده‌ای
    // (سبد خرید/قیمت مؤثر) به آن نیاز نداشت.
    public function getFinalPriceAttribute()
    {
        return $this->discount_price ?? $this->price;
    }
}
