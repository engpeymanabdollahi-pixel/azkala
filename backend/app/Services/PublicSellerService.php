<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PublicSellerService
{
    public function findActiveSellerBySlug(string $slug): ?User
    {
        return User::where('slug', $slug)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->first();
    }

    public function findActiveSellerById(int $id): User
    {
        return User::where('id', $id)
            ->where('role', 'seller')
            ->where('is_active', true)
            ->firstOrFail();
    }

    public function findSellerById(int $id): User
    {
        return User::where('id', $id)->where('role', 'seller')->firstOrFail();
    }

    public function getSellerProducts(User $seller, array $filters): LengthAwarePaginator
    {
        // images لازم است چون ProductResource آن را می‌خواند؛ بدون eager load
        // هر محصول یک کوئری product_images جداگانه می‌زد.
        $query = Product::where('seller_id', $seller->id)
            ->where('is_active', true)
            ->with(['category', 'images']);

        $sort = $filters['sort'] ?? 'newest';
        match ($sort) {
            'popular' => $query->orderBy('sales_count', 'desc'),
            'price_low' => $query->orderBy('price', 'asc'),
            'price_high' => $query->orderBy('price', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            default => $query->latest(),
        };

        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['has_discount'])) {
            $query->whereNotNull('compare_price')->whereRaw('compare_price > price');
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    public function followSeller(User $user, User $seller): void
    {
        DB::transaction(function () use ($user, $seller) {
            $user->followingSellers()->attach($seller->id);
            $seller->increment('followers_count');
            Cache::forget("public_seller_profile_{$seller->slug}");
        });
    }

    public function unfollowSeller(User $user, User $seller): void
    {
        DB::transaction(function () use ($user, $seller) {
            $user->followingSellers()->detach($seller->id);
            $seller->decrement('followers_count');
            Cache::forget("public_seller_profile_{$seller->slug}");
        });
    }

    public function getFollowedSellers(User $user): LengthAwarePaginator
    {
        return $user->followingSellers()
            ->where('is_active', true)
            ->latest('seller_follows.created_at')
            ->paginate(20);
    }
}
