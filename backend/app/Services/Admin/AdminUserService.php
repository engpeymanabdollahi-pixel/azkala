<?php

namespace App\Services\Admin;

use App\Models\Notification;
use App\Models\SellerRequest;
use App\Models\User;
use App\Repositories\AdminUserRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
                $user->is_online = $user->last_seen_at && Carbon::parse($user->last_seen_at)->gte(now()->subMinutes(5));
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
        } catch (Exception $e) {
            Log::error('AdminUserService@getUsers: '.$e->getMessage());
            throw new Exception('خطا در دریافت لیست کاربران: '.$e->getMessage(), 500);
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
        } catch (Exception $e) {
            Log::error('AdminUserService@getUserDetails: '.$e->getMessage());
            throw new Exception('کاربر یافت نشد', 404);
        }
    }

    public function updateUserRole(int $id, string $role): User
    {
        try {
            $user = $this->repository->findOrFail($id);
            if (! in_array($role, ['customer', 'seller', 'admin'])) {
                throw new Exception('نقش نامعتبر است', 422);
            }

            return $this->repository->update($user, ['role' => $role]);
        } catch (Exception $e) {
            Log::error('AdminUserService@updateUserRole: '.$e->getMessage());
            throw $e;
        }
    }

    public function updateUserStatus(int $id, bool $isActive): User
    {
        try {
            $user = $this->repository->findOrFail($id);

            return $this->repository->update($user, ['is_active' => $isActive]);
        } catch (Exception $e) {
            Log::error('AdminUserService@updateUserStatus: '.$e->getMessage());
            throw $e;
        }
    }

    // ❌ approveSeller() («تایید یک‌کلیکی فروشنده») حذف شد — رجوع به کامنت
    // مشابه در AdminUserRepository برای دلیل کامل. تنها راه واقعی تبدیل به
    // فروشنده initialApproveRequest/finalApproveRequest زیر است.

    public function rejectSeller(int $id): User
    {
        try {
            $user = $this->repository->findOrFail($id);

            return $this->repository->rejectSeller($user);
        } catch (Exception $e) {
            Log::error('AdminUserService@rejectSeller: '.$e->getMessage());
            throw new Exception('خطا در رد فروشنده', 500);
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
        } catch (Exception $e) {
            Log::error('AdminUserService@getSellerRequests: '.$e->getMessage());
            throw new Exception('خطا در دریافت درخواست‌ها', 500);
        }
    }

    // ✅ approveSellerRequest() (تک‌مرحله‌ای، وضعیت 'pending' که هیچ رکورد
    // واقعی‌ای هرگز آن مقدار را نداشت) اینجا بود، ولی هیچ‌جای فرانت‌اند آن
    // را صدا نمی‌زد (نه دکمه‌ای، نه mutation ای) — با initialApproveRequest/
    // finalApproveRequest زیر جایگزین شده. حذف شد تا با نامی تقریباً یکسان
    // با متدهای واقعی، توسعه‌دهنده‌ی بعدی را گمراه نکند.

    /**
     * رد درخواست فروشندگی — در هر سه مرحله‌ی «در انتظار» قابل رد است.
     * ✅ قبلاً status !== 'pending' چک می‌شد؛ چون هیچ درخواست واقعی‌ای
     * هیچ‌وقت دقیقاً 'pending' نمی‌شود (مقادیر واقعی pending_initial/
     * pending_documents/pending_final/approved/rejected هستند)، این شرط
     * همیشه true بود — یعنی دکمه‌ی «رد درخواست» در پنل ادمین برای هر
     * درخواستی، در هر وضعیتی، همیشه با «این درخواست قبلاً بررسی شده است»
     * شکست می‌خورد. این دقیقاً همان دکمه‌ای است که SellerRequestDetailModal
     * صدا می‌زند.
     */
    public function rejectSellerRequest(int $requestId, int $adminId, string $reason): void
    {
        $sellerRequest = SellerRequest::findOrFail($requestId);

        if (! in_array($sellerRequest->status, ['pending_initial', 'pending_documents', 'pending_final'], true)) {
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

    /**
     * مرحله ۲ (از دید ادمین): تایید اولیه و اطلاع‌رسانی برای تکمیل مدارک.
     * ✅ قبلاً منطق این متد مستقیم در AdminUserController بود، برخلاف الگوی
     * بقیه‌ی این کنترلر که همه‌چیز را به Service می‌سپارد.
     */
    public function initialApproveRequest(int $requestId): void
    {
        $sellerRequest = SellerRequest::findOrFail($requestId);

        if ($sellerRequest->status !== 'pending_initial') {
            throw new Exception('این درخواست در وضعیت مناسبی برای تایید اولیه نیست.');
        }

        DB::transaction(function () use ($sellerRequest) {
            $sellerRequest->update([
                'status' => 'pending_documents',
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

            Notification::create([
                'user_id' => $sellerRequest->user_id,
                'type' => 'seller_request_initial_approved',
                'title' => 'تایید اولیه درخواست فروشندگی',
                'message' => 'درخواست اولیه شما تایید شد. لطفاً برای تکمیل مدارک (تصویر کارت ملی و جواز کسب) و افتتاح نهایی شعبه، به پنل فروشندگی مراجعه کنید.',
            ]);
        });
    }

    /**
     * مرحله ۴ (از دید ادمین): تایید نهایی پس از آپلود مدارک — نقش کاربر به
     * seller تغییر می‌کند و برای اولین بار اطلاعات واقعی شعبه (نام، اسلاگ،
     * اطلاعات بانکی، کد ملی) از SellerRequest به User منتقل می‌شود.
     *
     * ✅ قبل از این فیکس، این متد فقط role کاربر را seller می‌کرد — shop_name/
     * bank_name/bank_account هرگز کپی نمی‌شدند. یعنی فروشنده‌ای که کل مسیر
     * ۴ مرحله‌ای را با موفقیت طی می‌کرد، در عمل با role=seller ولی
     * shop_name/slug/bank_account خالی به پنل فروشندگی می‌رسید — صفحه‌ی
     * عمومی /seller/:slug و اطلاعات تسویه‌حساب او همیشه خالی می‌ماندند.
     * slug به‌صورت خودکار و امن در برابر تکراری‌شدن، در رویداد saving مدل
     * User ساخته می‌شود (رجوع به User::boot()).
     */
    public function finalApproveRequest(int $requestId): void
    {
        $sellerRequest = SellerRequest::findOrFail($requestId);

        if ($sellerRequest->status !== 'pending_final') {
            throw new Exception('این درخواست هنوز مدارک آن تکمیل نشده است.');
        }

        DB::transaction(function () use ($sellerRequest) {
            $sellerRequest->update([
                'status' => 'approved',
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

            $user = $sellerRequest->user;

            $attributes = array_filter([
                'role' => 'seller',
                'shop_name' => $sellerRequest->shop_name,
                'national_code' => $sellerRequest->national_code,
                'phone' => $sellerRequest->phone,
                'bank_name' => $sellerRequest->bank_name,
                'bank_account' => $sellerRequest->bank_account,
                'seller_verified_at' => now(),
                'seller_badge' => 'bronze',
            ], fn ($value) => $value !== null);

            // ✅ اگر فروشنده در فرم مدارک یک نام مستعار (shop_alias) دلخواه
            // برای آدرس عمومی‌اش انتخاب کرده باشد، همان مبنای اسلاگ می‌شود؛
            // وگرنه User::boot() خودش از shop_name می‌سازد.
            if (! empty($sellerRequest->shop_alias)) {
                $attributes['slug'] = User::generateUniqueSlug($sellerRequest->shop_alias, $user->id);
            }

            // ✅ حیاتی: $sellerRequest->user()->update([...]) (روی خودِ رابطه‌ی
            // BelongsTo) یک UPDATE مستقیم روی دیتابیس اجرا می‌کند و کاملاً از
            // رویدادهای مدل مثل saving رد می‌شود — یعنی هوک تولید خودکار
            // اسلاگ در User::boot() هیچ‌وقت اجرا نمی‌شد و User.slug همیشه
            // خالی می‌ماند. با گرفتن خودِ نمونه‌ی User و صدا زدن update()
            // روی آن، رویداد مدل درست اجرا می‌شود.
            $user->update($attributes);

            Notification::create([
                'user_id' => $sellerRequest->user_id,
                'type' => 'seller_request_final_approved',
                'title' => 'تبریک! شعبه شما افتتاح شد',
                'message' => 'مدارک شما با موفقیت تایید شد. اکنون می‌توانید وارد پنل فروشندگی شده و محصولات خود را ثبت کنید.',
            ]);
        });
    }
}
