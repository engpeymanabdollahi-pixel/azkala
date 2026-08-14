<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ ستون avatar روی users فقط مسیر نسبی storage را نگه می‌دارد (مثل
 * "seller/avatars/x.jpg"). قبلاً هر جا $user->avatar مستقیم serialize
 * می‌شد (UserResource، ReviewResource، MagazineResource، ProductResource،
 * پاسخ خام AuthController، رویدادهای چت و چند Service دیگر) همین مسیر خام
 * به فرانت‌اند می‌رفت و آواتار به‌جز در یکی دو صفحه (که خودشان
 * normalizer محلی داشتند) شکسته نمایش داده می‌شد. accessor روی User
 * این را در یک نقطه رفع می‌کند.
 */
class UserAvatarAccessorTest extends TestCase
{
    use RefreshDatabase;

    public function test_avatar_accessor_returns_a_full_storage_url(): void
    {
        $user = User::factory()->create(['avatar' => 'seller/avatars/x.jpg']);

        $this->assertSame(asset('storage/seller/avatars/x.jpg'), $user->avatar);
        $this->assertStringStartsWith('http', $user->avatar);
    }

    public function test_avatar_accessor_returns_null_when_not_set(): void
    {
        $user = User::factory()->create(['avatar' => null]);

        $this->assertNull($user->avatar);
    }

    public function test_raw_original_still_returns_the_relative_storage_path(): void
    {
        // ✅ کد داخلی (مثل Storage::disk('public')->delete()) باید همچنان
        // مسیر نسبی خام را ببیند، نه URL کامل accessor - وگرنه حذف فایل
        // قدیمی بی‌صدا شکست می‌خورد.
        $user = User::factory()->create(['avatar' => 'seller/avatars/x.jpg']);

        $this->assertSame('seller/avatars/x.jpg', $user->getRawOriginal('avatar'));
    }

    public function test_avatar_is_a_full_url_when_the_model_is_serialized_to_json(): void
    {
        $user = User::factory()->create(['avatar' => 'seller/avatars/x.jpg']);

        $this->assertSame(asset('storage/seller/avatars/x.jpg'), $user->toArray()['avatar']);
    }

    public function test_banner_accessor_returns_a_full_storage_url(): void
    {
        $user = User::factory()->create(['banner' => 'seller/banners/x.jpg']);

        $this->assertSame(asset('storage/seller/banners/x.jpg'), $user->banner);
    }

    public function test_banner_raw_original_still_returns_the_relative_storage_path(): void
    {
        $user = User::factory()->create(['banner' => 'seller/banners/x.jpg']);

        $this->assertSame('seller/banners/x.jpg', $user->getRawOriginal('banner'));
    }
}
