<?php

namespace Tests\Feature\Api;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'خانه',
            'full_name' => 'علی رضایی',
            'phone' => '09121234567',
            'province' => 'تهران',
            'city' => 'تهران',
            'address' => 'خیابان آزادی، پلاک ۱',
            'postal_code' => '1234567890',
        ], $overrides);
    }

    private function makeAddress(User $user, array $overrides = []): Address
    {
        return Address::create(array_merge($this->validPayload(), [
            'user_id' => $user->id,
            'is_default' => false,
        ], $overrides));
    }

    public function test_unauthenticated_user_cannot_access_addresses(): void
    {
        $this->getJson('/api/v1/addresses')->assertStatus(401);
    }

    public function test_user_can_create_address(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/addresses', $this->validPayload())
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('addresses', [
            'user_id' => $this->user->id,
            'title' => 'خانه',
        ]);
    }

    public function test_create_address_requires_mandatory_fields(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/addresses', ['title' => 'ناقص'])
            ->assertStatus(422);
    }

    public function test_first_address_becomes_default_automatically(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/addresses', $this->validPayload());

        $response->assertStatus(201);
        $this->assertTrue((bool) $response->json('data.is_default'));
    }

    public function test_creating_a_new_default_unsets_the_previous_one(): void
    {
        $first = $this->makeAddress($this->user, ['is_default' => true]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/addresses', $this->validPayload(['title' => 'دفتر', 'is_default' => true]))
            ->assertStatus(201);

        $this->assertFalse((bool) $first->fresh()->is_default);
        $this->assertSame(1, Address::where('user_id', $this->user->id)->where('is_default', true)->count());
    }

    public function test_index_only_returns_own_addresses(): void
    {
        $this->makeAddress($this->user, ['title' => 'مال من']);
        $this->makeAddress($this->otherUser, ['title' => 'مال دیگری']);

        $response = $this->actingAs($this->user)->getJson('/api/v1/addresses');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('مال من', $response->json('data.0.title'));
    }

    public function test_user_can_update_own_address(): void
    {
        $address = $this->makeAddress($this->user);

        $this->actingAs($this->user)
            ->putJson("/api/v1/addresses/{$address->id}", ['title' => 'عنوان جدید'])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame('عنوان جدید', $address->fresh()->title);
    }

    public function test_user_cannot_update_another_users_address(): void
    {
        $address = $this->makeAddress($this->otherUser, ['title' => 'دست‌نخورده']);

        $this->actingAs($this->user)
            ->putJson("/api/v1/addresses/{$address->id}", ['title' => 'هک‌شده'])
            ->assertStatus(404);

        $this->assertSame('دست‌نخورده', $address->fresh()->title);
    }

    public function test_user_cannot_delete_another_users_address(): void
    {
        $address = $this->makeAddress($this->otherUser);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/addresses/{$address->id}")
            ->assertStatus(404);

        $this->assertNotNull($address->fresh());
    }

    public function test_deleting_the_default_address_promotes_another_one(): void
    {
        $older = $this->makeAddress($this->user, ['title' => 'قدیمی']);
        $default = $this->makeAddress($this->user, ['title' => 'پیش‌فرض', 'is_default' => true]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/addresses/{$default->id}")
            ->assertStatus(200);

        $this->assertTrue((bool) $older->fresh()->is_default);
    }

    public function test_user_can_set_an_address_as_default(): void
    {
        $first = $this->makeAddress($this->user, ['is_default' => true]);
        $second = $this->makeAddress($this->user);

        $this->actingAs($this->user)
            ->putJson("/api/v1/addresses/{$second->id}/default")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertTrue((bool) $second->fresh()->is_default);
        $this->assertFalse((bool) $first->fresh()->is_default);
    }

    public function test_user_cannot_set_another_users_address_as_default(): void
    {
        $address = $this->makeAddress($this->otherUser);

        $this->actingAs($this->user)
            ->putJson("/api/v1/addresses/{$address->id}/default")
            ->assertStatus(404);

        $this->assertFalse((bool) $address->fresh()->is_default);
    }
}
