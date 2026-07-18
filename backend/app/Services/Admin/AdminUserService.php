<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Models\SellerRequest;
use App\Repositories\AdminUserRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class AdminUserService
{
    protected AdminUserRepository $repository;

    public function __construct(AdminUserRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getUsers(array $filters = [], int $perPage = 20): array
    {
        try {
            $users = $this->repository->getUsers($filters, $perPage);
            $stats = $this->repository->getStats();

            $users->getCollection()->transform(function ($user) {
                $user->is_online = $user->last_seen_at && \Carbon\Carbon::parse($user->last_seen_at)->gte(now()->subMinutes(5));
                $user->total_conversations = ($user->buyer_conversations_count ?? $user->conversations_as_buyer_count ?? 0) +
                                            ($user->seller_conversations_count ?? $user->conversations_as_seller_count ?? 0);
                $user->sentiment_score = (float) ($user->sentiments_avg_score ?? 0);
                $user->sentiment_label = $user->sentiment_score > 0.1 ? 'positive' : ($user->sentiment_score < -0.1 ? 'negative' : 'neutral');
                $user->report_count = (int) ($user->reported_count ?? 0);
                return $user;
            });

            return [
                'users' => $users->items(),
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ],
                'stats' => $stats,
            ];
        } catch (\Exception $e) {
            Log::error('AdminUserService@getUsers: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت لیست کاربران: ' . $e->getMessage(), 500);
        }
    }

    public function getUserDetails(int $id): array
    {
        try {
            $user = $this->repository->getUserWithCounts($id);
            return [
                'user' => $user,
                'products_count' => $user->products_count,
                'orders_count' => $user->orders_count,
                'reviews_count' => $user->reviews_count,
            ];
        } catch (\Exception $e) {
            Log::error('AdminUserService@getUserDetails: ' . $e->getMessage());
            throw new \Exception('کاربر یافت نشد', 404);
        }
    }

    public function updateUserRole(int $id, string $role): User
    {
        try {
            $user = $this->repository->findOrFail($id);
            if (!in_array($role, ['customer', 'seller', 'admin'])) {
                throw new \Exception('نقش نامعتبر است', 422);
            }
            return $this->repository->update($user, ['role' => $role]);
        } catch (\Exception $e) {
            Log::error('AdminUserService@updateUserRole: ' . $e->getMessage());
            throw $e;
        }
    }

    public function updateUserStatus(int $id, bool $isActive): User
    {
        try {
            $user = $this->repository->findOrFail($id);
            return $this->repository->update($user, ['is_active' => $isActive]);
        } catch (\Exception $e) {
            Log::error('AdminUserService@updateUserStatus: ' . $e->getMessage());
            throw $e;
        }
    }

    public function approveSeller(int $id): User
    {
        try {
            $user = $this->repository->findOrFail($id);
            return $this->repository->approveSeller($user);
        } catch (\Exception $e) {
            Log::error('AdminUserService@approveSeller: ' . $e->getMessage());
            throw new \Exception('خطا در تأیید فروشنده', 500);
        }
    }

    public function rejectSeller(int $id): User
    {
        try {
            $user = $this->repository->findOrFail($id);
            return $this->repository->rejectSeller($user);
        } catch (\Exception $e) {
            Log::error('AdminUserService@rejectSeller: ' . $e->getMessage());
            throw new \Exception('خطا در رد فروشنده', 500);
        }
    }

    public function getSellerRequests(int $perPage = 20): array
    {
        try {
            $requests = $this->repository->getSellerRequests($perPage);
            return [
                'requests' => $requests->map(function ($req) {
                    return [
                        'id' => $req->id,
                        'user' => $req->user ? ['id' => $req->user->id, 'name' => $req->user->name, 'email' => $req->user->email, 'phone' => $req->user->phone] : null,
                        'shop_name' => $req->shop_name,
                        'national_code' => $req->national_code,
                        'phone' => $req->phone,
                        'description' => $req->description,
                        'status' => $req->status,
                        'rejection_reason' => $req->rejection_reason,
                        'created_at' => $req->created_at ? $req->created_at->format('Y-m-d H:i') : null,
                    ];
                }),
                'pagination' => [
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                    'total' => $requests->total(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('AdminUserService@getSellerRequests: ' . $e->getMessage());
            throw new \Exception('خطا در دریافت درخواست‌ها', 500);
        }
    }

    /**
     * تأیید درخواست فروشندگی و تغییر نقش کاربر
     */
    public function approveSellerRequest(int $requestId, int $adminId): void
    {
        $sellerRequest = SellerRequest::findOrFail($requestId);

        if ($sellerRequest->status !== 'pending') {
            throw new Exception('این درخواست قبلاً بررسی شده است.');
        }

        DB::transaction(function () use ($sellerRequest, $adminId) {
            $sellerRequest->update([
                'status' => 'approved',
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);

            // تغییر نقش کاربر به فروشنده
            $sellerRequest->user()->update(['role' => 'seller']);
        });
    }

    /**
     * رد درخواست فروشندگی
     */
    public function rejectSellerRequest(int $requestId, int $adminId, string $reason): void
    {
        $sellerRequest = SellerRequest::findOrFail($requestId);

        if ($sellerRequest->status !== 'pending') {
            throw new Exception('این درخواست قبلاً بررسی شده است.');
        }

        DB::transaction(function () use ($sellerRequest, $adminId, $reason) {
            $sellerRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);
        });
    }
}