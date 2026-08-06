<?php

namespace Tests\Unit\Services;

use App\Models\SellerRequest;
use App\Models\User;
use App\Repositories\AdminUserRepository;
use App\Services\Admin\AdminUserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ پوشش جریان واقعی ۴مرحله‌ای درخواست فروشندگی (initial-approve →
 * upload-documents → final-approve، به‌علاوه رد در هر مرحله) که قبل از این
 * فیکس اصلاً تست نداشت — دقیقاً همان چیزی که SellerRequestPage.tsx و
 * AdminUsersPage.tsx در عمل صدا می‌زنند.
 */
class AdminUserServiceSellerRequestApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected AdminUserService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AdminUserService(new AdminUserRepository());
    }

    public function test_final_approve_copies_shop_and_bank_data_to_user(): void
    {
        $user = User::factory()->create(['role' => 'pending_seller', 'shop_name' => null, 'slug' => null]);
        $request = SellerRequest::factory()->pendingFinal()->create([
            'user_id' => $user->id,
            'shop_name' => 'فروشگاه تست دیجیتال',
            'bank_account' => 'IR000000000000000000000001',
            'bank_name' => 'بانک ملت',
        ]);

        $this->service->finalApproveRequest($request->id);

        $user->refresh();
        $this->assertSame('seller', $user->role);
        $this->assertSame('فروشگاه تست دیجیتال', $user->shop_name);
        $this->assertSame('IR000000000000000000000001', $user->bank_account);
        $this->assertSame('بانک ملت', $user->bank_name);
        $this->assertNotEmpty($user->slug, 'slug باید از shop_name خودکار ساخته شده باشد');
        $this->assertNotNull($user->seller_verified_at);

        $this->assertDatabaseHas('seller_requests', ['id' => $request->id, 'status' => 'approved']);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'seller_request_final_approved',
        ]);
    }

    public function test_final_approve_generates_unique_slug_on_shop_name_collision(): void
    {
        // فروشنده‌ی اول از قبل با همین نام تایید شده.
        $firstUser = User::factory()->create(['role' => 'seller', 'shop_name' => 'فروشگاه مشابه', 'slug' => 'froshgah-mshabh']);

        $secondUser = User::factory()->create(['role' => 'pending_seller', 'shop_name' => null, 'slug' => null]);
        $secondRequest = SellerRequest::factory()->pendingFinal()->create([
            'user_id' => $secondUser->id,
            'shop_name' => 'فروشگاه مشابه',
        ]);

        // ✅ Mutation-relevant: قبل از فیکس User::boot()، این خط با
        // «UNIQUE constraint failed: users.slug» کرش می‌کرد چون هیچ منطق
        // برخوردی برای اسلاگ تکراری وجود نداشت.
        $this->service->finalApproveRequest($secondRequest->id);

        $secondUser->refresh();
        $this->assertNotSame($firstUser->slug, $secondUser->slug);
        $this->assertStringStartsWith($firstUser->slug, $secondUser->slug);
    }

    public function test_final_approve_rejects_request_not_yet_at_pending_final(): void
    {
        $request = SellerRequest::factory()->pendingDocuments()->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('این درخواست هنوز مدارک آن تکمیل نشده است.');

        $this->service->finalApproveRequest($request->id);
    }

    public function test_initial_approve_moves_status_and_sends_notification(): void
    {
        $request = SellerRequest::factory()->pendingInitial()->create();

        $this->service->initialApproveRequest($request->id);

        $this->assertDatabaseHas('seller_requests', ['id' => $request->id, 'status' => 'pending_documents']);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $request->user_id,
            'type' => 'seller_request_initial_approved',
        ]);
    }

    /**
     * ✅ باگ اصلی: قبلاً status !== 'pending' چک می‌شد، مقداری که هیچ درخواست
     * واقعی‌ای هرگز نمی‌گیرد — یعنی این عملیات برای هر سه وضعیتِ واقعیِ
     * «در انتظار» همیشه شکست می‌خورد.
     */
    public function test_reject_works_at_every_real_pending_status(): void
    {
        foreach (['pendingInitial', 'pendingDocuments', 'pendingFinal'] as $state) {
            $request = SellerRequest::factory()->{$state}()->create();

            $this->service->rejectSellerRequest($request->id, 1, 'دلیل رد آزمایشی');

            $this->assertDatabaseHas('seller_requests', [
                'id' => $request->id,
                'status' => 'rejected',
                'rejection_reason' => 'دلیل رد آزمایشی',
            ]);
        }
    }

    public function test_reject_fails_for_already_finalized_request(): void
    {
        $request = SellerRequest::factory()->approved()->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('این درخواست قبلاً بررسی شده است.');

        $this->service->rejectSellerRequest($request->id, 1, 'دلیل');
    }
}
