<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * لاگ append-only هر تغییر در Administrative Access (نقش/Permission).
 * فقط توسط AdminAccessService نوشته می‌شود.
 */
class AdminAccessLog extends Model
{
    public const ACTION_ROLE_ASSIGNED = 'admin_role_assigned';

    public const ACTION_ROLE_REMOVED = 'admin_role_removed';

    public const ACTION_PERMISSION_GRANTED = 'permission_granted';

    public const ACTION_PERMISSION_REVOKED = 'permission_revoked';

    protected $fillable = [
        'actor_user_id',
        'target_user_id',
        'action',
        'old_value',
        'new_value',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }
}
