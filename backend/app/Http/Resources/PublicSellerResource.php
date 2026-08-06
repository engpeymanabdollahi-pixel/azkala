<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PublicSellerResource extends JsonResource
{
    public function toArray($request)
    {
        $shopName = $this->shop_name ?? $this->name ?? 'فروشگاه بدون نام';
        
        return [
            'id' => $this->id,
            'user_id' => $this->id,
            'shop_name' => $shopName,
            'slug' => $this->slug,
            'display_title' => "شعبه آنلاین {$shopName}",
            'logo' => $this->avatar,
            'banner' => $this->banner,
            'description' => $this->bio,
            'status' => $this->role === 'seller' && $this->is_active ? 'active' : 'pending',
            'rating' => (float) ($this->seller_rating ?? 0),
            // ✅ قبلاً همیشه ۰ هاردکد بود («برای جلوگیری از خطای کوئری» طبق
            // کامنت قدیمی) — یعنی امتیاز ستاره‌ای واقعی همیشه کنار «۰ نظر»
            // ثابت نشان داده می‌شد. حالا از PublicSellerService::attachRealCounts
            // می‌آید (فقط برای واکشی تک‌فروشنده تا از N+1 در لیست‌های
            // top/followed جلوگیری شود؛ در آن‌جا این attribute اصلاً ست
            // نمی‌شود و به‌درستی روی ۰ می‌ماند چون فعلاً جایی نمایش داده نمی‌شود).
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'products_count' => (int) ($this->products_count ?? 0),
            'orders_count' => (int) ($this->orders_count ?? 0),
            'followers_count' => (int) ($this->followers_count ?? 0),
            'is_followed_by_current_user' => $request->user() 
                ? $request->user()->isFollowingSeller($this->id) 
                : false,
            'verified_at' => $this->seller_verified_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}