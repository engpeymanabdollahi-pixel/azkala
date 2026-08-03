<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class SellerRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'shop_name',      // نام صحیح در دیتابیس
        'email',          // ✅ اضافه شد (چون در کنترلر استفاده می‌شود)
        'phone',
        'description',
        'national_code',
        'id_card_image',
        'business_license',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'admin_id',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}