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
            'health_score' => 100,
            'rating' => (float) ($this->seller_rating ?? 0),
            'reviews_count' => 0, // برای جلوگیری از خطای کوئری، فعلاً ۰ در نظر گرفته شد
            'products_count' => (int) ($this->products_count ?? 0),
            'orders_count' => 0, // برای جلوگیری از خطای کوئری، فعلاً ۰ در نظر گرفته شد
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