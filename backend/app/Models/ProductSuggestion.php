<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSuggestion extends Model
{
    protected $fillable = [
        'conversation_id',
        'product_id',
        'suggested_by',
        'source',
        'relevance_score',
        'is_clicked',
        'is_purchased',
    ];

    protected $casts = [
        'relevance_score' => 'float',
        'is_clicked' => 'boolean',
        'is_purchased' => 'boolean',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function suggestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suggested_by');
    }
}