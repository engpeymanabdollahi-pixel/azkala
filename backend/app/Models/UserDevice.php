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

    public function phoneModel(): BelongsTo
    {
        return $this->belongsTo(PhoneModel::class);
    }
}