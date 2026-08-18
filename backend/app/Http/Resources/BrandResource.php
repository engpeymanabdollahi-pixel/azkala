<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BrandResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo,
            'country' => $this->country,
            'website' => $this->website,
            'is_active' => $this->is_active,
            // ✅ فاز ۰ Brand Backend Correctness: قبلاً $this->is_verified یک
            // attribute غیرموجود بود (مدل فقط verified_at + متد isVerified()
            // دارد، هیچ ستون/accessor به نام is_verified در کار نیست) —
            // یعنی همیشه null برمی‌گشت، صرف‌نظر از وضعیت واقعی تایید. حالا
            // از همان متد موجود مدل استفاده می‌شود (بدون ساخت attribute
            // جدید) — دقیقاً منبع حقیقتی که AdminBrandRepository::verify/
            // unverify هم می‌نویسند (فقط verified_at را تغییر می‌دهند).
            'is_verified' => $this->isVerified(),
            // ✅ فاز ۱ Brand Hub: is_featured ستون واقعی DB است (از قبل در
            // مدل/فکتوری/فیلتر ادمین هست و AdminBrandRepository::bulkAction
            // آن را می‌نویسد) ولی هیچ‌وقت در پاسخ عمومی serialize نمی‌شد —
            // یعنی فرانت اصلاً نمی‌توانست بخش «برندهای ویژه» را با داده‌ی
            // واقعی بسازد. صرفاً افزودن یک کلید به خروجی، بدون هیچ منطق
            // جدید یا تغییر رفتار فیلدهای موجود.
            'is_featured' => (bool) $this->is_featured,

            // Counts
            // ✅ این مقدار فقط وقتی صحیح است که فراخوان (BrandController)
            // withCount/loadCount('products') را از قبل اجرا کرده باشد؛
            // اگر نه، به ستون خام DB (که هیچ observer/جابی آن را sync
            // نمی‌کند — تایید‌شده در Audit) fallback می‌کند. فیکس واقعی در
            // BrandController::show()/bySlug() است، نه اینجا.
            'products_count' => $this->products_count ?? 0,
            
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}