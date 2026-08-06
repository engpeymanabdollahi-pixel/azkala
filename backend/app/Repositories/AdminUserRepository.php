<?php

namespace App\Repositories;

use App\Models\SellerRequest;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminUserRepository
{
    /**
     * Get users with advanced filters
     */
    public function getUsers(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = User::query();

        // Role filter
        if (! empty($filters['role']) && $filters['role'] !== 'all') {
            $query->where('role', $filters['role']);
        }

        // Active status filter
        if (isset($filters['is_active']) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Online status filter
        if (! empty($filters['online']) && $filters['online'] !== 'all') {
            if ($filters['online'] === 'online') {
                $query->where('last_seen_at', '>=', now()->subMinutes(5));
            } elseif ($filters['online'] === 'offline') {
                $query->where(function ($q) {
                    $q->where('last_seen_at', '<', now()->subMinutes(5))
                        ->orWhereNull('last_seen_at');
                });
            }
        }

        // Conversations count filter
        if (! empty($filters['conversations']) && $filters['conversations'] !== 'all') {
            $query->withCount([
                'conversationsAsBuyer as buyer_conversations_count',
                'conversationsAsSeller as seller_conversations_count',
            ]);

            switch ($filters['conversations']) {
                case 'none':
                    $query->havingRaw('(buyer_conversations_count + seller_conversations_count) = 0');
                    break;
                case 'few':
                    $query->havingRaw('(buyer_conversations_count + seller_conversations_count) BETWEEN 1 AND 5');
                    break;
                case 'medium':
                    $query->havingRaw('(buyer_conversations_count + seller_conversations_count) BETWEEN 6 AND 20');
                    break;
                case 'many':
                    $query->havingRaw('(buyer_conversations_count + seller_conversations_count) > 20');
                    break;
            }
        }

        // Sentiment filter
        if (! empty($filters['sentiment']) && $filters['sentiment'] !== 'all') {
            $query->withAvg('sentiments', 'score');

            switch ($filters['sentiment']) {
                case 'positive':
                    $query->having('sentiments_avg_score', '>', 0.1);
                    break;
                case 'neutral':
                    $query->havingRaw('(sentiments_avg_score BETWEEN -0.1 AND 0.1) OR sentiments_avg_score IS NULL');
                    break;
                case 'negative':
                    $query->having('sentiments_avg_score', '<', -0.1);
                    break;
            }
        }

        // Reports count filter
        if (! empty($filters['reports']) && $filters['reports'] !== 'all') {
            $query->withCount('reported as reported_count');

            switch ($filters['reports']) {
                case 'none':
                    $query->having('reported_count', '=', 0);
                    break;
                case 'few':
                    $query->having('reported_count', '>', 0)->having('reported_count', '<=', 2);
                    break;
                case 'many':
                    $query->having('reported_count', '>', 2);
                    break;
            }
        }

        // Search
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('shop_name', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Find user by ID
     */
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Find user by ID or fail
     */
    public function findOrFail(int $id): User
    {
        return User::findOrFail($id);
    }

    /**
     * Update user
     */
    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user;
    }

    /**
     * Get user with counts
     */
    public function getUserWithCounts(int $id): User
    {
        return User::withCount(['products', 'orders', 'reviews'])->findOrFail($id);
    }

    /**
     * Get users statistics
     */
    public function getStats(): array
    {
        return [
            'total' => User::count(),
            'customers' => User::where('role', 'customer')->count(),
            'sellers' => User::where('role', 'seller')->count(),
            'admins' => User::where('role', 'admin')->count(),
            'pending_sellers' => User::where('role', 'pending_seller')->count(),
            'active' => User::where('is_active', true)->count(),
            'inactive' => User::where('is_active', false)->count(),
            'today' => User::whereDate('created_at', today())->count(),
        ];
    }

    /**
     * ❌ approveSeller() («تایید یک‌کلیکی فروشنده») اینجا بود و از دکمه‌ی
     * «تایید به عنوان فروشنده» روی هر ردیفِ مشتری در تب کاربران صدا زده
     * می‌شد — کاملاً موازی و مستقل از خط‌لولهٔ واقعی درخواست فروشندگی
     * (SellerRequest چهار‌مرحله‌ای). چون هیچ shop_name/مدارک/اطلاعات بانکی‌ای
     * هیچ‌وقت جمع‌آوری نمی‌شد، کاربرِ «تاییدشده» با این دکمه role=seller
     * می‌گرفت اما shop_name خالی می‌ماند — یعنی طبق User::boot() هیچ‌وقت
     * slug نمی‌گرفت و صفحه‌ی عمومی /seller/:slug او برای همیشه ۴۰۴ می‌داد.
     * حذف شد؛ تنها راه واقعی تبدیل به فروشنده همان initialApproveRequest/
     * finalApproveRequest (رجوع به AdminUserService) است.
     */

    /**
     * Reject seller — لغو وضعیت فروشندگیِ یک فروشندهٔ از قبل تاییدشده
     * (برخلاف approveSeller، این یک اقدام مستقل و واقعی است: مثلاً تخلف
     * فروشنده‌ای که قبلاً از مسیر واقعی تایید شده بود).
     */
    public function rejectSeller(User $user): User
    {
        $user->update(['role' => 'customer']);

        return $user;
    }

    /**
     * Get seller requests with pagination
     */
    public function getSellerRequests(int $perPage = 20): LengthAwarePaginator
    {
        return SellerRequest::with('user:id,name,email,phone')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
