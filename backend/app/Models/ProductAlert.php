<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductAlert extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'product_id',
        'type',
        'target_price',
        'original_price',
        'is_active',
        'is_triggered',
        'triggered_at',
        'channels',
    ];

    protected $casts = [
        'target_price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_triggered' => 'boolean',
        'triggered_at' => 'datetime',
        'channels' => 'array',
    ];

    /**
     * Alert types
     */
    const TYPE_RESTOCK = 'restock';
    const TYPE_PRICE_DROP = 'price_drop';
    const TYPE_TARGET_PRICE = 'target_price';

    /**
     * Default notification channels
     */
    const DEFAULT_CHANNELS = ['database', 'email'];

    // ==================== Relationships ====================

    /**
     * Get the user who created this alert
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product associated with this alert
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ==================== Scopes ====================

    /**
     * Scope to filter by active alerts
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by triggered alerts
     */
    public function scopeTriggered($query)
    {
        return $query->where('is_triggered', true);
    }

    /**
     * Scope to filter by not triggered alerts
     */
    public function scopeNotTriggered($query)
    {
        return $query->where('is_triggered', false);
    }

    /**
     * Scope to filter by alert type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter restock alerts
     */
    public function scopeRestock($query)
    {
        return $query->where('type', self::TYPE_RESTOCK);
    }

    /**
     * Scope to filter price drop alerts
     */
    public function scopePriceDrop($query)
    {
        return $query->where('type', self::TYPE_PRICE_DROP);
    }

    /**
     * Scope to filter target price alerts
     */
    public function scopeTargetPrice($query)
    {
        return $query->where('type', self::TYPE_TARGET_PRICE);
    }

    /**
     * Scope to filter alerts for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter alerts for a specific product
     */
    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope to filter alerts ready for processing (active and not triggered)
     */
    public function scopeReadyForProcessing($query)
    {
        return $query->where('is_active', true)
                     ->where('is_triggered', false);
    }

    // ==================== Helper Methods ====================

    /**
     * Check if this is a restock alert
     */
    public function isRestockAlert(): bool
    {
        return $this->type === self::TYPE_RESTOCK;
    }

    /**
     * Check if this is a price drop alert
     */
    public function isPriceDropAlert(): bool
    {
        return $this->type === self::TYPE_PRICE_DROP;
    }

    /**
     * Check if this is a target price alert
     */
    public function isTargetPriceAlert(): bool
    {
        return $this->type === self::TYPE_TARGET_PRICE;
    }

    /**
     * Mark the alert as triggered
     */
    public function markAsTriggered(): void
    {
        $this->update([
            'is_triggered' => true,
            'triggered_at' => now(),
        ]);
    }

    /**
     * Deactivate the alert
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Activate the alert
     */
    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }
}
