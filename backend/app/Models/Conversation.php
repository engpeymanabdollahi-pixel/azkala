<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;
    protected $fillable = [
        'buyer_id',
        'seller_id',
        'product_id',
        'is_active',
        'last_message_at',
        'updated_at',  // ✅ اضافه شد - برای touch() در chatservice
        'created_at',  // ✅ اضافه شد - برای اطمینان
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    // ==================== Relationships ====================

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    // ==================== Scopes ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('buyer_id', $userId)
                     ->orWhere('seller_id', $userId);
    }

    // ==================== Methods ====================

    public function getOtherUser($userId)
    {
        return $this->buyer_id === $userId ? $this->seller : $this->buyer;
    }

    public function isUserParticipant($userId)
    {
        return $this->buyer_id === $userId || $this->seller_id === $userId;
    }

    public function getUnreadCount($userId)
    {
        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->count();
    }

    // Alias for backward compatibility (جلوگیری از خطای undefined relationship)
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'buyer_id');
    }}
