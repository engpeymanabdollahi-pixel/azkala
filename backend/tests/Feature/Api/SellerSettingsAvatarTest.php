<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * ✅ بعد از اضافه‌شدن accessor روی User::avatar (تبدیل خودکار مسیر نسبی
 * به URL کامل)، این تست تضمین می‌کند که حذف فایل قدیمی هنگام آپلود
 * آواتار جدید همچنان کار می‌کند — چون آن حذف باید مسیر نسبیِ خام
 * (getRawOriginal) را ببیند، نه URL کامل accessor؛ وگرنه
 * Storage::delete() بی‌صدا هیچ فایلی پاک نمی‌کند و فایل‌های قدیمی برای
 * همیشه روی دیسک باقی می‌مانند.
 */
class SellerSettingsAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_response_avatar_is_a_full_url_not_a_raw_path(): void
    {
        // ✅ Storage::fake() نوشتن واقعی روی دیسک را عوض نمی‌کند چون
        // کنترلر مستقیم با GD روی storage_path() می‌نویسد؛ برای همین فایل
        // واقعی تولید و در پایان پاک می‌شود.
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        $response = $this->actingAs($seller)->postJson('/api/v1/seller/settings', [
            'shop_name' => 'فروشگاه تست',
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 100, 100),
        ]);

        $response->assertOk();
        $avatarUrl = $response->json('data.avatar');
        $this->assertNotNull($avatarUrl);
        $this->assertStringStartsWith('http', $avatarUrl);

        Storage::disk('public')->delete($seller->fresh()->getRawOriginal('avatar'));
    }

    public function test_reuploading_avatar_deletes_the_old_file_from_disk(): void
    {
        // ✅ کنترلر برای پردازش تصویر مستقیم با GD (imagewebp) روی مسیر
        // واقعی storage_path() می‌نویسد، نه از طریق Storage::put() — یعنی
        // Storage::fake() مسیر نوشتن را عوض نمی‌کند. برای همین دیسک واقعی
        // public استفاده و در پایان پاک‌سازی می‌شود، به‌جای fake کردن آن.
        $seller = User::factory()->create(['role' => 'seller', 'is_active' => true]);

        $this->actingAs($seller)->postJson('/api/v1/seller/settings', [
            'shop_name' => 'فروشگاه تست',
            'avatar' => UploadedFile::fake()->image('avatar1.jpg', 100, 100),
        ])->assertOk();

        $oldPath = $seller->fresh()->getRawOriginal('avatar');
        $this->assertNotNull($oldPath);
        $this->assertTrue(Storage::disk('public')->exists($oldPath), 'Uploaded avatar was not written to the real public disk.');

        try {
            $this->actingAs($seller->fresh())->postJson('/api/v1/seller/settings', [
                'shop_name' => 'فروشگاه تست',
                'avatar' => UploadedFile::fake()->image('avatar2.jpg', 100, 100),
            ])->assertOk();

            $this->assertFalse(
                Storage::disk('public')->exists($oldPath),
                'Old avatar file was not deleted on re-upload - getRawOriginal() regression?'
            );
        } finally {
            $newPath = $seller->fresh()->getRawOriginal('avatar');
            Storage::disk('public')->delete(array_filter([$oldPath, $newPath]));
        }
    }
}
