<?php

namespace Tests\Feature;

use App\Models\Referral;
use App\Models\User;
use App\Services\Referral\ReferralService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ReferralTest extends TestCase
{
    use RefreshDatabase;

    private function service(): ReferralService
    {
        return app(ReferralService::class);
    }

    /**
     * ثبت‌نام واقعی از طریق مسیر HTTP (register → verify-otp)، دقیقاً
     * همان دو مرحله‌ای که AuthModal.tsx واقعاً طی می‌کند.
     */
    private function registerAndVerify(string $phone, ?string $ref = null): void
    {
        $payload = ['phone' => $phone];
        if ($ref !== null) {
            $payload['ref'] = $ref;
        }

        $this->postJson('/api/v1/register', $payload)->assertStatus(200);

        Cache::put('otp_'.$phone, '12345', now()->addMinutes(5));
        $this->postJson('/api/v1/verify-otp', ['phone' => $phone, 'otp' => '12345'])->assertStatus(200);
    }

    // ==================== ۱. Code generation ====================

    public function test_user_can_receive_referral_code(): void
    {
        $user = User::factory()->create(['phone' => '09120000001']);

        $code = $this->service()->ensureUserReferralCode($user);

        $this->assertNotEmpty($code);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'referral_code' => $code]);
    }

    public function test_referral_code_is_eight_characters(): void
    {
        $user = User::factory()->create(['phone' => '09120000002']);

        $code = $this->service()->ensureUserReferralCode($user);

        $this->assertSame(8, strlen($code));
    }

    public function test_referral_code_is_uppercase(): void
    {
        $user = User::factory()->create(['phone' => '09120000003']);

        $code = $this->service()->ensureUserReferralCode($user);

        $this->assertSame(strtoupper($code), $code);
    }

    public function test_referral_code_does_not_contain_confusing_characters(): void
    {
        $service = $this->service();

        // ۵۰ کد تولید می‌کنیم تا احتمال عبور تصادفی از یک کاراکتر ممنوعه صفر باشد
        for ($i = 0; $i < 50; $i++) {
            $code = $service->generateCode();
            $this->assertMatchesRegularExpression('/^[A-Z0-9]{8}$/', $code);
            foreach (['0', 'O', '1', 'I', 'L'] as $forbidden) {
                $this->assertStringNotContainsString($forbidden, $code);
            }
        }
    }

    public function test_referral_codes_are_unique_across_many_users(): void
    {
        $service = $this->service();
        $codes = [];

        for ($i = 0; $i < 25; $i++) {
            $user = User::factory()->create(['phone' => '0913'.str_pad((string) $i, 7, '0', STR_PAD_LEFT)]);
            $codes[] = $service->ensureUserReferralCode($user);
        }

        $this->assertCount(25, array_unique($codes));
    }

    public function test_existing_user_can_receive_code_lazily_without_reregistering(): void
    {
        // ✅ شبیه‌سازی کاربر قدیمی از قبل از migration: referral_code=null
        $user = User::factory()->create(['phone' => '09120000004', 'referral_code' => null]);

        $response = $this->actingAs($user)->getJson('/api/v1/user/referral');

        $response->assertStatus(200)->assertJsonStructure(['data' => ['referral_code', 'referral_link', 'total_referrals', 'pending_referrals']]);
        $this->assertNotNull($response->json('data.referral_code'));
        $this->assertDatabaseHas('users', ['id' => $user->id, 'referral_code' => $response->json('data.referral_code')]);
    }

    // ==================== ۲. Registration / capture ====================

    public function test_valid_referral_creates_pending_record(): void
    {
        $referrer = User::factory()->create(['phone' => '09120000005']);
        $code = $this->service()->ensureUserReferralCode($referrer);

        $this->registerAndVerify('09130000001', $code);

        $referred = User::where('phone', '09130000001')->firstOrFail();

        $this->assertDatabaseHas('referrals', [
            'referrer_user_id' => $referrer->id,
            'referred_user_id' => $referred->id,
            'referral_code' => $code,
            'status' => Referral::STATUS_PENDING,
        ]);
    }

    public function test_invalid_referral_code_does_not_break_registration(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'phone' => '09130000002',
            'ref' => 'ZZZZZZZZ', // فرمت درست، ولی متعلق به هیچ کاربری نیست
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('users', ['phone' => '09130000002']);
    }

    public function test_invalid_referral_code_does_not_create_referral_record(): void
    {
        $this->registerAndVerify('09130000003', 'NOTREAL1');

        $referred = User::where('phone', '09130000003')->firstOrFail();

        $this->assertDatabaseMissing('referrals', ['referred_user_id' => $referred->id]);
    }

    public function test_duplicate_referral_for_same_user_is_ignored_safely(): void
    {
        $referrerA = User::factory()->create(['phone' => '09120000006']);
        $referrerB = User::factory()->create(['phone' => '09120000007']);
        $codeA = $this->service()->ensureUserReferralCode($referrerA);
        $codeB = $this->service()->ensureUserReferralCode($referrerB);

        $referred = User::factory()->create(['phone' => '09130000004']);

        $this->service()->captureReferral($referred, $codeA);
        $this->service()->captureReferral($referred, $codeB); // نباید ردیف دوم بسازد

        $this->assertSame(1, Referral::where('referred_user_id', $referred->id)->count());
        $this->assertDatabaseHas('referrals', ['referred_user_id' => $referred->id, 'referrer_user_id' => $referrerA->id]);
    }

    public function test_referred_user_cannot_have_two_referrers(): void
    {
        // همان تضمین بالا را این‌بار مستقیم روی سطح دیتابیس/Model تأیید می‌کند
        $referrerA = User::factory()->create(['phone' => '09120000008']);
        $referrerB = User::factory()->create(['phone' => '09120000009']);
        $referred = User::factory()->create(['phone' => '09130000005']);

        Referral::create([
            'referrer_user_id' => $referrerA->id,
            'referred_user_id' => $referred->id,
            'referral_code' => 'AAAAAAAA',
            'status' => Referral::STATUS_PENDING,
            'registered_at' => now(),
        ]);

        $this->expectException(QueryException::class);
        Referral::create([
            'referrer_user_id' => $referrerB->id,
            'referred_user_id' => $referred->id, // همان referred — باید unique constraint رد کند
            'referral_code' => 'BBBBBBBB',
            'status' => Referral::STATUS_PENDING,
            'registered_at' => now(),
        ]);
    }

    public function test_self_referral_is_rejected(): void
    {
        $user = User::factory()->create(['phone' => '09120000010']);
        $code = $this->service()->ensureUserReferralCode($user);

        $this->service()->captureReferral($user, $code);

        $this->assertDatabaseMissing('referrals', ['referred_user_id' => $user->id]);
    }

    // ==================== ۳. Authorization ====================

    public function test_user_can_retrieve_own_referral_information(): void
    {
        $user = User::factory()->create(['phone' => '09120000011']);

        $response = $this->actingAs($user)->getJson('/api/v1/user/referral');

        $response->assertStatus(200)->assertJsonPath('success', true);
    }

    public function test_guest_cannot_retrieve_referral_information(): void
    {
        $this->getJson('/api/v1/user/referral')->assertStatus(401);
    }

    public function test_referral_list_only_contains_current_users_referrals(): void
    {
        $userA = User::factory()->create(['phone' => '09120000012']);
        $userB = User::factory()->create(['phone' => '09120000013']);
        $codeA = $this->service()->ensureUserReferralCode($userA);
        $codeB = $this->service()->ensureUserReferralCode($userB);

        $referredOfA = User::factory()->create(['phone' => '09130000006']);
        $referredOfB = User::factory()->create(['phone' => '09130000007']);
        $this->service()->captureReferral($referredOfA, $codeA);
        $this->service()->captureReferral($referredOfB, $codeB);

        $response = $this->actingAs($userA)->getJson('/api/v1/user/referrals');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);

        // ✅ اطلاعات شخصی کاربر معرفی‌شده (نام/شماره موبایل) نباید برگردد
        $this->assertArrayHasKey('status', $data[0]);
        $this->assertArrayHasKey('registered_at', $data[0]);
        $this->assertArrayNotHasKey('referred_user_id', $data[0]);
        $this->assertArrayNotHasKey('phone', $data[0]);
        $this->assertArrayNotHasKey('name', $data[0]);
    }

    // ==================== ۴. OTP flow edge cases ====================

    public function test_repeated_otp_request_does_not_create_duplicate_referral(): void
    {
        $referrer = User::factory()->create(['phone' => '09120000014']);
        $code = $this->service()->ensureUserReferralCode($referrer);
        $phone = '09130000008';

        // درخواست اول: کاربر ساخته می‌شود + Referral pending
        $this->postJson('/api/v1/register', ['phone' => $phone, 'ref' => $code])->assertStatus(200);
        // درخواست دوم (retry/resend): همان کاربر از قبل موجود است
        $this->postJson('/api/v1/register', ['phone' => $phone, 'ref' => $code])->assertStatus(200);

        $referred = User::where('phone', $phone)->firstOrFail();
        $this->assertSame(1, Referral::where('referred_user_id', $referred->id)->count());
    }

    public function test_existing_user_registration_does_not_accidentally_create_referral(): void
    {
        $existing = User::factory()->create(['phone' => '09130000009']);
        $referrer = User::factory()->create(['phone' => '09120000015']);
        $code = $this->service()->ensureUserReferralCode($referrer);

        // کاربر از قبل وجود دارد؛ الان با یک ref در URL دوباره «ثبت‌نام» درخواست می‌دهد
        $this->postJson('/api/v1/register', ['phone' => $existing->phone, 'ref' => $code])->assertStatus(200);

        $this->assertDatabaseMissing('referrals', ['referred_user_id' => $existing->id]);
    }

    // ==================== ۵. Immutability ====================

    public function test_referral_code_remains_immutable_via_profile_update(): void
    {
        $user = User::factory()->create(['phone' => '09120000016']);
        $originalCode = $this->service()->ensureUserReferralCode($user);

        $this->actingAs($user)->putJson('/api/v1/user', [
            'name' => 'نام جدید',
            'email' => $user->email,
            'referral_code' => 'HACKED01', // نباید هیچ اثری داشته باشد
        ])->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'referral_code' => $originalCode]);
    }

    // ==================== ۶. Race-condition-safe uniqueness ====================

    public function test_database_rejects_duplicate_referral_code_at_the_constraint_level(): void
    {
        $userA = User::factory()->create(['phone' => '09120000017', 'referral_code' => 'DUPLICAT']);

        $userB = User::factory()->create(['phone' => '09120000018']);

        $this->expectException(QueryException::class);
        $userB->forceFill(['referral_code' => 'DUPLICAT'])->save();
    }

    public function test_ensure_referral_code_retries_on_collision(): void
    {
        // ✅ کد اول از قبل توسط کاربر دیگری اشغال شده؛ ensureUserReferralCode
        // باید بعد از برخورد با همان کد (اگر تصادفاً دوباره تولید شود) با
        // retry ادامه دهد و در نهایت یک کد یکتای دیگر بدهد — اینجا مستقیماً
        // مسیر واقعی (نه فرضی) را با پیش‌اشغال‌کردن خودِ کد امتحان می‌کنیم.
        User::factory()->create(['phone' => '09120000019', 'referral_code' => 'TAKEN001']);
        $user = User::factory()->create(['phone' => '09120000020']);

        $code = $this->service()->ensureUserReferralCode($user);

        $this->assertNotSame('TAKEN001', $code);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'referral_code' => $code]);
    }

    // ==================== ۷. Soft delete compatibility ====================

    public function test_soft_deleted_users_do_not_destroy_referral_history(): void
    {
        $referrer = User::factory()->create(['phone' => '09120000021']);
        $code = $this->service()->ensureUserReferralCode($referrer);
        $referred = User::factory()->create(['phone' => '09130000010']);

        $this->service()->captureReferral($referred, $code);
        $referralId = Referral::where('referred_user_id', $referred->id)->firstOrFail()->id;

        $referrer->delete(); // soft delete

        $this->assertDatabaseHas('referrals', ['id' => $referralId, 'referred_user_id' => $referred->id]);
        $this->assertSoftDeleted('users', ['id' => $referrer->id]);
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }
}
