<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDevice extends Model
{
    protected $fillable = ['user_id', 'phone_model_id', 'nickname'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * ✅ ستون phone_model_id حالا واقعاً به device_models اشاره می‌کند
     * (نه به phone_models خالی و بلااستفاده) — همان جدولی که
     * Product::deviceModels() هم به آن وصل است.
     */
    public function phoneModel(): BelongsTo
    {
        return $this->belongsTo(DeviceModel::class, 'phone_model_id');
    }
}
