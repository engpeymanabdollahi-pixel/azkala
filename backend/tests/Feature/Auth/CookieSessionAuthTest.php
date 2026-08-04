<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

/**
 * احراز هویت کوکی‌محور Sanctum.
 *
 * پیش از این، لاگین فقط توکن برمی‌گرداند و فرانت‌اند آن را در حافظه نگه می‌داشت
 * بدون persist کردن، در حالی که isAuthenticated را persist می‌کرد. نتیجه این بود
 * که بعد از هر refresh کاربر «لاگین» به نظر می‌رسید ولی توکن نداشت؛ اولین
 * درخواست ۴۰۱ می‌گرفت و interceptor کاربر را با پیام «نشست شما منقضی شده است»
 * بیرون می‌انداخت. یعنی هر بار F5 یعنی خروج از حساب.
 *
 * حالا لاگین نشست هم می‌سازد. کوکی نشست httpOnly است، پس با XSS خوانده نمی‌شود
 * و خودش از reload جان سالم به در می‌برد.
 */
class CookieSessionAuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'phone' => '09120000000',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ], $overrides));
    }

    /**
     * هدر Origin عمداً فرستاده می‌شود: EnsureFrontendRequestsAreStateful فقط با
     * دیدن مبدأیی که در sanctum.stateful هست میدلورهای نشست را وصل می‌کند.
     * بدون آن، تست مسیر توکنی را می‌سنجد نه مسیر کوکی — یعنی همان چیزی که
     * می‌خواهیم بسنجیم اصلاً اجرا نمی‌شود.
     */
    private function login(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/v1/login', array_merge([
            'phone' => '09120000000',
            'password' => 'secret123',
            ], $overrides));
    }

    public function test_login_starts_a_session(): void
    {
        $user = $this->makeUser();

        $this->login()->assertStatus(200)->assertJsonPath('success', true);

        // این همان چیزی است که بعد از refresh باید باقی بماند.
        $this->assertAuthenticatedAs($user);
    }

    /**
     * بدنه‌ی نشست به تنهایی کافی نیست؛ درخواست بعدی هم باید بدون هیچ هدر
     * Authorization شناخته شود. این دقیقاً همان حالتی است که پس از reload
     * پیش می‌آید: کوکی هست، توکن نیست.
     */
    public function test_the_session_authenticates_the_next_request_without_a_bearer_token(): void
    {
        $user = $this->makeUser();

        $this->login()->assertStatus(200);

        $this->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/v1/user')
            ->assertStatus(200)
            ->assertJsonPath('data.id', $user->id);
    }

    /**
     * کلاینت‌های غیرمرورگری نشست ندارند، پس توکن باید همچنان صادر شود.
     */
    public function test_login_still_returns_a_usable_token(): void
    {
        $this->makeUser();

        $token = $this->login()->assertStatus(200)->json('data.token');

        $this->assertNotEmpty($token);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/user')
            ->assertStatus(200);
    }

    public function test_wrong_password_does_not_start_a_session(): void
    {
        $this->makeUser();

        $this->login(['password' => 'wrong-password'])->assertStatus(401);

        $this->assertGuest();
    }

    public function test_an_inactive_account_does_not_start_a_session(): void
    {
        $this->makeUser(['is_active' => false]);

        $this->login()->assertStatus(403);

        $this->assertGuest();
    }

    /**
     * با نشست کوکی، currentAccessToken یک TransientToken است که متد delete
     * ندارد. صدا زدنِ بی‌قیدِ delete روی آن BadMethodCallException می‌داد، یعنی
     * خروج از حساب برای هر کاربر مرورگری ۵۰۰ برمی‌گرداند.
     */
    public function test_logout_over_a_cookie_session_succeeds_and_ends_the_session(): void
    {
        $this->makeUser();
        $this->login()->assertStatus(200);

        $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/v1/logout')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        // AuthManager کاربرِ resolve‌شده را درون همان instance اپلیکیشن نگه
        // می‌دارد و بین درخواست‌های یک تست باقی می‌ماند. در production هر درخواست
        // پروسه‌ی تازه است، پس برای سنجش رفتار واقعی باید guardها را ریست کرد؛
        // بدون این، تست حتی با logoutِ کاملاً سالم هم کاربر را «لاگین» می‌بیند.
        $this->app->make('auth')->forgetGuards();

        $this->assertGuest();

        // و نشست واقعاً بی‌اعتبار شده باشد، نه اینکه فقط پیام موفقیت بدهد.
        $this->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/v1/user')->assertStatus(401);
    }

    /**
     * مسیر توکنی هم باید همچنان کار کند و توکن را واقعاً باطل کند.
     */
    public function test_logout_over_a_bearer_token_revokes_that_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('test')->plainTextToken;

        $this->assertSame(1, PersonalAccessToken::where('tokenable_id', $user->id)->count());

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/logout')
            ->assertStatus(200);

        $this->assertSame(0, PersonalAccessToken::where('tokenable_id', $user->id)->count());
    }

    /**
     * پورت پیش‌فرض Vite در فهرست پیش‌فرض لاراول نیست (آنجا 3000 آمده). اگر
     * نباشد، مرورگر کوکی می‌فرستد ولی Sanctum درخواست را stateful نمی‌شمارد و
     * احراز هویت بی‌صدا به توکن برمی‌گردد — یعنی همان باگ اولیه برمی‌گردد.
     */
    public function test_the_frontend_dev_origin_is_treated_as_stateful(): void
    {
        $stateful = config('sanctum.stateful');

        $this->assertContains('localhost:5173', $stateful);
        $this->assertContains('127.0.0.1:5173', $stateful);
    }
}
