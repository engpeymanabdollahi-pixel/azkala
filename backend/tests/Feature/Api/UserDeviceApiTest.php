<?php

namespace Tests\Feature\Api;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceSeries;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ✅ این تست قبلاً PhoneModel::create(...) می‌ساخت و آی‌دی همان مدل قدیمی و
 * بلااستفاده را به‌عنوان phone_model_id ارسال می‌کرد. user_devices.phone_model_id
 * حالا واقعاً به device_models اشاره می‌کند (رجوع کنید به مهاجرت
 * repoint_user_devices_to_device_models و UserDeviceRealDataTest) — پس اینجا
 * هم باید از DeviceModel واقعی استفاده شود، نه PhoneModel قدیمی.
 */
class UserDeviceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected DeviceModel $phoneModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        $brand = DeviceBrand::factory()->create();
        $series = DeviceSeries::factory()->create(['brand_id' => $brand->id]);
        $this->phoneModel = DeviceModel::factory()->create([
            'series_id' => $series->id,
            'name' => 'Galaxy S24',
            'slug' => 'galaxy-s24',
        ]);
    }

    public function test_unauthenticated_user_cannot_list_devices(): void
    {
        $this->getJson('/api/v1/user/devices')->assertStatus(401);
    }

    public function test_user_can_add_a_device(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/user/devices', [
                'phone_model_id' => $this->phoneModel->id,
                'nickname' => 'گوشی کاری',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $this->user->id,
            'phone_model_id' => $this->phoneModel->id,
        ]);
    }

    public function test_adding_the_same_device_twice_does_not_duplicate(): void
    {
        $payload = ['phone_model_id' => $this->phoneModel->id, 'nickname' => 'اولی'];

        $this->actingAs($this->user)->postJson('/api/v1/user/devices', $payload)->assertStatus(201);
        $this->actingAs($this->user)->postJson('/api/v1/user/devices', $payload)->assertStatus(201);

        $this->assertSame(1, UserDevice::where('user_id', $this->user->id)->count());
    }

    public function test_adding_a_nonexistent_phone_model_fails_validation(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/user/devices', ['phone_model_id' => 999999])
            ->assertStatus(422);
    }

    public function test_index_only_returns_own_devices(): void
    {
        UserDevice::create(['user_id' => $this->user->id, 'phone_model_id' => $this->phoneModel->id, 'nickname' => 'مال من']);
        UserDevice::create(['user_id' => $this->otherUser->id, 'phone_model_id' => $this->phoneModel->id, 'nickname' => 'مال دیگری']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/user/devices');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('مال من', $response->json('data.0.nickname'));
    }

    public function test_user_can_delete_own_device(): void
    {
        $device = UserDevice::create([
            'user_id' => $this->user->id,
            'phone_model_id' => $this->phoneModel->id,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/user/devices/{$device->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('user_devices', ['id' => $device->id]);
    }

    public function test_user_cannot_delete_another_users_device(): void
    {
        $device = UserDevice::create([
            'user_id' => $this->otherUser->id,
            'phone_model_id' => $this->phoneModel->id,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/user/devices/{$device->id}")
            ->assertStatus(404)
            ->assertJsonPath('success', false);

        // The important part: the other user's device must still exist.
        $this->assertDatabaseHas('user_devices', ['id' => $device->id]);
    }

    /**
     * deleteDevice() scopes on user_id, so "no such device" and "someone else's
     * device" are the same query miss. Both answer 404 with the same body, so
     * the endpoint cannot be used to probe which device IDs exist.
     */
    public function test_deleting_a_missing_device_matches_the_foreign_device_response(): void
    {
        $foreign = UserDevice::create([
            'user_id' => $this->otherUser->id,
            'phone_model_id' => $this->phoneModel->id,
        ]);

        $missing = $this->actingAs($this->user)->deleteJson('/api/v1/user/devices/999999');
        $others = $this->actingAs($this->user)->deleteJson("/api/v1/user/devices/{$foreign->id}");

        $missing->assertStatus(404);
        $others->assertStatus(404);
        $this->assertSame($missing->json('message'), $others->json('message'));
    }
}
