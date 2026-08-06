<?php

namespace Tests\Feature\Api;

use App\Models\SellerRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * ✅ کل جریان درخواست فروشندگی از سمت خودِ فروشنده (نه ادمین) — store →
 * upload-documents — قبل از این فیکس هیچ تستی نداشت.
 */
class SellerRequestFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_status_includes_rejection_reason(): void
    {
        // ✅ باگ اصلی: getStatus() فیلد rejection_reason را برنمی‌گرداند بود،
        // با اینکه واقعاً در دیتابیس ذخیره است — کاربرِ ردشده هیچ‌وقت دلیل
        // رد را در SellerRequestPage.tsx/ProfileSection.tsx نمی‌دید.
        $user = User::factory()->create();
        SellerRequest::factory()->rejected()->create([
            'user_id' => $user->id,
            'rejection_reason' => 'مدارک ناقص بود',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/user/seller-request-status');

        $response->assertOk()->assertJsonPath('rejection_reason', 'مدارک ناقص بود');
    }

    public function test_store_prevents_duplicate_request_at_every_real_pending_status(): void
    {
        // ✅ باگ اصلی: findActiveRequest قبلاً whereIn('status', ['pending', 'approved'])
        // چک می‌کرد — مقداری که هیچ درخواست واقعی‌ای هرگز نمی‌گیرد.
        foreach (['pending_initial', 'pending_documents', 'pending_final'] as $status) {
            $user = User::factory()->create(['role' => 'customer']);
            SellerRequest::factory()->create(['user_id' => $user->id, 'status' => $status]);

            $response = $this->actingAs($user)->postJson('/api/v1/seller-requests', [
                'full_name' => 'کاربر تست',
                'national_code' => '1234567890',
                'phone' => '09123456789',
                'proposed_shop_name' => 'فروشگاه دوم',
            ]);

            $response->assertStatus(400)->assertJsonPath('success', false);
            $this->assertSame(1, SellerRequest::where('user_id', $user->id)->count(), "برای وضعیت {$status} نباید درخواست دوم ساخته شود");
        }
    }

    public function test_store_allows_new_request_after_previous_one_was_rejected(): void
    {
        // ✅ رد شدن نباید کاربر را برای همیشه قفل کند — findActiveRequest
        // عمداً 'rejected' را در لیست مسدودکننده ندارد.
        $user = User::factory()->create(['role' => 'customer']);
        SellerRequest::factory()->rejected()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/v1/seller-requests', [
            'full_name' => 'کاربر تست',
            'national_code' => '1234567890',
            'phone' => '09123456789',
            'proposed_shop_name' => 'تلاش دوم',
        ]);

        $response->assertStatus(201)->assertJsonPath('success', true);
        $this->assertSame(2, SellerRequest::where('user_id', $user->id)->count());
    }

    public function test_upload_documents_persists_business_license_image_path(): void
    {
        // ✅ باگ اصلی: SellerRequest::$fillable قبلاً business_license_image
        // را نداشت (فقط business_license نامرتبط) — مسیر فایل واقعی هیچ‌وقت
        // ذخیره نمی‌شد، با اینکه خودِ آپلود موفق بود.
        Storage::fake('public');
        $user = User::factory()->create(['role' => 'pending_seller']);
        $sellerRequest = SellerRequest::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending_documents',
        ]);

        $response = $this->actingAs($user)->postJson(
            "/api/v1/seller-requests/{$sellerRequest->id}/upload-documents",
            [
                'bank_account' => 'IR000000000000000000000001',
                'bank_name' => 'بانک ملی',
                'id_card_image' => UploadedFile::fake()->image('id-card.jpg'),
                'business_license_image' => UploadedFile::fake()->image('license.jpg'),
            ]
        );

        $response->assertOk()->assertJsonPath('success', true);

        $sellerRequest->refresh();
        $this->assertSame('pending_final', $sellerRequest->status);
        $this->assertSame('IR000000000000000000000001', $sellerRequest->bank_account);
        $this->assertSame('بانک ملی', $sellerRequest->bank_name);
        $this->assertNotNull($sellerRequest->id_card_image);
        $this->assertNotNull($sellerRequest->business_license_image, 'مسیر جواز کسب باید ذخیره شده باشد');
        Storage::disk('public')->assertExists($sellerRequest->id_card_image);
        Storage::disk('public')->assertExists($sellerRequest->business_license_image);
    }

    public function test_upload_documents_rejects_wrong_status(): void
    {
        $user = User::factory()->create(['role' => 'pending_seller']);
        $sellerRequest = SellerRequest::factory()->pendingInitial()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson(
            "/api/v1/seller-requests/{$sellerRequest->id}/upload-documents",
            ['bank_account' => 'IR000000000000000000000001', 'id_card_image' => UploadedFile::fake()->image('id.jpg')]
        );

        $response->assertStatus(400)->assertJsonPath('success', false);
    }

    public function test_upload_documents_rejects_another_users_request(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $sellerRequest = SellerRequest::factory()->create(['user_id' => $owner->id, 'status' => 'pending_documents']);

        $response = $this->actingAs($attacker)->postJson(
            "/api/v1/seller-requests/{$sellerRequest->id}/upload-documents",
            ['bank_account' => 'IR000000000000000000000001', 'id_card_image' => UploadedFile::fake()->image('id.jpg')]
        );

        $response->assertStatus(403);
    }
}
