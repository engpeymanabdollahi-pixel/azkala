<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Review extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'user_id',
        'product_id',
        'title',
        'comment',
        'rating',
        'is_verified',
        'helpful_count',
        'status',
        'images',
        // ًں†• ظپغŒظ„ط¯ظ‡ط§غŒ ط¬ط¯غŒط¯ ط¨ط±ط§غŒ ظ¾ط§ط³ط® ط§ط¯ظ…غŒظ†
        'admin_reply',
        'replied_by',
        'replied_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'product_id' => 'integer',
        'rating' => 'integer',
        'is_verified' => 'boolean',
        'helpful_count' => 'integer',
        'images' => 'array',
        'replied_at' => 'datetime', // ًں†•
    ];

    // ==================== Relationships ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ًں†• ط±ط§ط¨ط·ظ‡ ط¨ط§ ط§ط¯ظ…غŒظ† ظ¾ط§ط³ط®â€Œط¯ظ‡ظ†ط¯ظ‡
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    // ==================== Scopes ====================

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    // ==================== Methods ====================

    public static function checkUserPurchased(int $userId, int $productId): bool
    {
        return \App\Models\OrderItem::whereHas('order', function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->where('status', '!=', 'cancelled');
        })->where('product_id', $productId)->exists();
    }

    public static function updateProductRating(int $productId): void
    {
        $product = Product::find($productId);
        if (!$product) return;

        $stats = self::where('product_id', $productId)
            ->where('status', 'approved')
            ->selectRaw('COUNT(*) as count, AVG(rating) as avg_rating')
            ->first();

        $product->reviews_count = $stats->count ?? 0;
        $product->rating = round($stats->avg_rating ?? 0, 2);
        $product->save();
    }
}