<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * ورودی عددی با ارقام فارسی.
 *
 * قواعد اعتبارسنجی شماره موبایل با `regex:/^09[0-9]{9}$/` نوشته شده‌اند و
 * `[0-9]` فقط ارقام لاتین را می‌گیرد. کاربر ایرانی که با کیبورد فارسی
 * «۰۹۱۲۰۰۰۰۰۰۰» تایپ می‌کند پیام «فرمت شماره موبایل صحیح نیست» می‌گرفت — بدون
 * اینکه بفهمد چه چیزی غلط است، چون شماره از نظر خودش دقیقاً درست بود.
 *
 * فاصله و خط تیره هم همین‌طور: «0912 000 0000» که از جایی کپی شده باشد رد
 * می‌شد.
 */
class PersianDigitInputTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::factory()->create([
            'phone' => '09120000000',
            'password' => Hash::make('secret123'),
            'is_active' => true,
        ]);
    }

    public static function phoneVariants(): array
    {
        return [
            'ارقام فارسی' => ['۰۹۱۲۰۰۰۰۰۰۰'],
            'ارقام عربی' => ['٠٩١٢٠٠٠٠٠٠٠'],
            'با فاصله' => ['0912 000 0000'],
            'با خط تیره' => ['0912-000-0000'],
            'ترکیب فارسی و فاصله' => ['۰۹۱۲ ۰۰۰ ۰۰۰۰'],
        ];
    }

    #[DataProvider('phoneVariants')]
    public function test_login_accepts_the_phone_number_as_the_user_typed_it(string $phone): void
    {
        $this->makeUser();

        $response = $this->postJson('/api/v1/login', [
            'phone' => $phone,
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $this->assertSame('09120000000', $response->json('data.user.phone'));
    }

    #[DataProvider('phoneVariants')]
    public function test_register_normalises_the_phone_number_before_validating(string $phone): void
    {
        $response = $this->postJson('/api/v1/register', ['phone' => $phone]);

        $response->assertOk();
        $this->assertSame('09120000000', $response->json('phone'));
    }

    public function test_register_lowercases_the_email_and_squishes_the_name(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'phone' => '09120000001',
            'email' => '  Ali@Example.COM ',
            'name' => "  علی    رضایی \n",
        ]);

        $response->assertOk();

        // بدون یکسان‌سازی، «Ali@Example.COM» و «ali@example.com» دو کاربر جدا
        // می‌ساختند و دفعه‌ی بعد ورود شکست می‌خورد.
        $this->assertDatabaseHas('users', [
            'phone' => '09120000001',
            'email' => 'ali@example.com',
            'name' => 'علی رضایی',
        ]);
    }

    public function test_a_genuinely_invalid_phone_number_is_still_rejected(): void
    {
        // بدون این، تست بالا با «هر ورودی را قبول کن» هم سبز می‌ماند.
        $this->postJson('/api/v1/login', [
            'phone' => '۰۸۱۲۰۰۰۰۰۰۰',
            'password' => 'secret123',
        ])->assertStatus(422);

        $this->postJson('/api/v1/register', ['phone' => 'not-a-number'])
            ->assertStatus(422);
    }
}
