<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'brand_id',
        'seller_id',
        'name',
        'slug',
        'short_description',
        'description',
        'price',
        // compare_price و specifications ستون واقعی‌اند و cast هم دارند، ولی در
        // fillable نبودند — یعنی create/update بی‌صدا نادیده‌شان می‌گرفت.
        'compare_price',
        'discount_price',
        'specifications',
        'stock',
        'sku',
        'main_image',
        'gallery',
        'rating',
        'reviews_count',
        'views_count',
        'sales_count',
        'is_active',
        'is_featured',
        'is_bestseller',
        'is_special_offer',
        'special_offer_ends_at',
    ];

    protected $casts = [
        'price' => 'decimal:4',
        'compare_price' => 'decimal:4',
        'discount_price' => 'decimal:4',
        'stock' => 'integer',
        'is_active' => 'boolean',
        // بدون این cast‌ها، MySQL این ستون‌ها را 0/1 برمی‌گرداند و JSON عدد
        // می‌شد نه boolean؛ فرانت‌اند `=== true` را برای همه‌شان false می‌گرفت.
        'is_featured' => 'boolean',
        'is_bestseller' => 'boolean',
        'is_special_offer' => 'boolean',
        'gallery' => 'array',
        'specifications' => 'array',
        'special_offer_ends_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    // ✅ Nearby Physical Stores — موجودی فیزیکی این محصول در فروشگاه‌های
    // مختلف (کاملاً مستقل از ستون stock بالا که موجودی آنلاین است).
    public function storeInventory()
    {
        return $this->hasMany(StoreInventory::class);
    }

    // ✅ Variant/Color System فاز ۲.۱: پایه‌ی داده‌ای — فقط رابطه، بدون
    // هیچ تغییری در price/stock/sku فعلی این مدل. محصولی که هیچ ردیف
    // variant ندارد (اکثریت قطعی محصولات امروز) دقیقاً مثل قبل رفتار
    // می‌کند؛ این رابطه فقط وقتی داده‌ای دارد که صریحاً برایش ساخته شود.
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

        public function deviceModels()
    {
        return $this->belongsToMany(
            \App\Models\DeviceModel::class,  // ۱. کلاس مدل مقصد
            'device_model_product',          // ۲. نام دقیق جدول واسط (رشته متنی)
            'product_id',                    // ۳. کلید خارجی این مدل در جدول واسط
            'device_model_id'                // ۴. کلید خارجی مدل مقصد در جدول واسط
        );
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeSpecialOffers($query)
    {
        return $query->where('is_special_offer', true)
                     ->where('special_offer_ends_at', '>', now());
    }

    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeInBrand($query, $brandId)
    {
        return $query->where('brand_id', $brandId);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('short_description', 'like', "%{$search}%")
              ->orWhere('sku', 'like', "%{$search}%");
        });
    }

    public function getFinalPriceAttribute()
    {
        return $this->discount_price ?? $this->price;
    }

    public function getDiscountPercentageAttribute()
    {
        if ($this->discount_price && $this->price > 0) {
            return round((($this->price - $this->discount_price) / $this->price) * 100);
        }
        return 0;
    }

    public function getIsInStockAttribute()
    {
        return $this->stock > 0;
    }
public function wishlists()
{
    return $this->hasMany(Wishlist::class);
}

public function isWishlistedBy($userId)
{
    return $this->wishlists()->where('user_id', $userId)->exists();
}

/**
 * Get all product alerts for this product
 */
public function alerts()
{
    return $this->hasMany(ProductAlert::class);
}
}