<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
        'type',
        'file_url',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // ==================== Relationships ====================

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // ==================== Scopes ====================

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    // ==================== Methods ====================

    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    // Alias for backward compatibility (جلوگیری از خطای undefined relationship)
    public function user()
    {
        // نکته: اگر نام ستون شما در دیتابیس sender_id است، 'user_id' را به 'sender_id' تغییر دهید
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }}
