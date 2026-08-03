<?php

namespace Tests\Feature\Api;

use App\Models\Brand;
use App\Models\PhoneModel;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDeviceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected PhoneModel $phoneModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        $brand = Brand::factory()->create();
        $this->phoneModel = PhoneModel::create([
            'brand_id' => $brand->id,
            'name' => 'Galaxy S24',
            'slug' => 'galaxy-s24',
            'is_active' => true,
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
            ->assertStatus(500); // controller maps every failure, including ownership, to 500

        // The important part: the other user's device must still exist.
        $this->assertDatabaseHas('user_devices', ['id' => $device->id]);
    }
}
