<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ticket_number',
        'conversation_id',
        'user_id',
        'assigned_to',
        'subject',
        'description',
        'priority',
        'status',
        'category',
        'resolution_notes',
        'resolved_at',
        'closed_at',
        'response_time_minutes',
        'is_escalated',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'is_escalated' => 'boolean',
    ];

    // ==================== Relationships ====================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

  public function messages(): HasMany
{
    return $this->hasMany(TicketMessage::class, 'ticket_id');
}

    // ==================== Methods ====================

    public static function generateTicketNumber(): string
    {
        $prefix = 'TKT';
        $date = now()->format('ymd');
        $random = strtoupper(substr(uniqid(), -6));
        return "{$prefix}-{$date}-{$random}";
    }

    public function assignTo(int $userId): void
    {
        $this->update([
            'assigned_to' => $userId,
            'status' => 'in_progress',
        ]);
    }

    public function resolve(string $notes = ''): void
    {
        $this->update([
            'status' => 'resolved',
            'resolution_notes' => $notes,
            'resolved_at' => now(),
        ]);

        if ($this->created_at) {
            $this->update([
                'response_time_minutes' => $this->created_at->diffInMinutes(now()),
            ]);
        }
    }

    public function close(): void
    {
        $this->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);
    }

    public function escalate(): void
    {
        $this->update([
            'is_escalated' => true,
            'priority' => 'urgent',
        ]);
    }

    // ==================== Scopes ====================

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', 'urgent');
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }
}