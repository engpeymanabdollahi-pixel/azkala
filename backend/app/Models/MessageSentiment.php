<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageSentiment extends Model
{
    protected $fillable = [
        'message_id',
        'conversation_id',
        'user_id',
        'sentiment',
        'score',
        'keywords',
    ];

    protected $casts = [
        'score' => 'float',
        'keywords' => 'array',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}