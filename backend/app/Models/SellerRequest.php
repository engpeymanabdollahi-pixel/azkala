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
        'shop_alias',     // ✅ اضافه شد — برای اسلاگ شعبه بعد از تایید نهایی
        'email',          // ✅ اضافه شد (چون در کنترلر استفاده می‌شود)
        'phone',
        'description',
        'national_code',
        'id_card_image',
        'business_license',
        // ✅ ستون واقعی که SellerRequestService::uploadDocuments روی آن
        // می‌نویسد business_license_image است، نه business_license (که یک
        // ستون قدیمی و بلااستفاده است) — قبلاً چون این کلید در fillable
        // نبود، Eloquent آن را در mass-assignment بی‌صدا نادیده می‌گرفت و
        // مسیر فایل آپلودشده هیچ‌وقت ذخیره نمی‌شد.
        'business_license_image',
        'bank_name',      // ✅ اضافه شد
        'bank_account',
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