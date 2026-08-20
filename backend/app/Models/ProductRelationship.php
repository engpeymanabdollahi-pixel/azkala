<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ProductRelationship — «همراه این محصول» (complement).
 *
 * عمداً مستقل از سازگاری دستگاه (DeviceModel↔Product) و از
 * ProductRepository::getRelatedProducts (کوئری پویای هم‌دسته‌ای، «مشابه»)
 * — این جدول فقط نوعِ «مکمل» را پایدار می‌کند، طبق Phase 2 Product
 * Relationship audit این پروژه.
 */
class ProductRelationship extends Model
{
    use HasFactory;

    public const TYPE_COMPLEMENT = 'complement';

    protected $fillable = [
        'source_product_id',
        'target_product_id',
        'type',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'type' => self::TYPE_COMPLEMENT,
        'sort_order' => 0,
        'is_active' => true,
    ];

    public function sourceProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'source_product_id');
    }

    public function targetProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'target_product_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeComplement($query)
    {
        return $query->where('type', self::TYPE_COMPLEMENT);
    }
}
