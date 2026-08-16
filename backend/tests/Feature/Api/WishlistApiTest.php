<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
        $this->product = Product::factory()->create(['is_active' => true]);
    }

    public function test_unauthenticated_user_cannot_access_wishlist(): void
    {
        $this->getJson('/api/v1/wishlist')->assertStatus(401);
    }

    public function test_user_can_view_empty_wishlist(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/v1/wishlist')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_user_can_add_product_to_wishlist(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/wishlist', ['product_id' => $this->product->id])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_user_cannot_add_same_product_twice(): void
    {
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->postJson('/api/v1/wishlist', ['product_id' => $this->product->id])
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertSame(1, Wishlist::where('user_id', $this->user->id)->count());
    }

    /**
     * ✅ رگرسیون واقعی برای Part 2 (Wishlist 409 root-cause audit): چک
     * SELECT و INSERT در WishlistService::addToWishlist دو کوئری جدا
     * هستند — بین آن دو، یک درخواست همزمان دیگر (دو تب باز، یا race که
     * گارد frontend نتوانسته جلویش را بگیرد) می‌تواند همان ردیف را واقعاً
     * بسازد. اینجا این پنجره‌ی زمانی را به‌صورت deterministic (بدون نیاز
     * به دو thread واقعی) با رویداد Eloquent `creating` شبیه‌سازی می‌کند:
     * درست قبل از این‌که سطرِ واقعیِ سرویس INSERT شود، یک ردیف تکراری
     * مستقیم در DB درج می‌شود — یعنی SELECT اولیه‌ی سرویس چیزی پیدا
     * نکرده (رد شده)، ولی INSERT خودش الان با همان unique constraint
     * (wishlists.user_id+product_id) تداخل می‌کند.
     *
     * پیش از فیکس، این حالت یک QueryException خام (SQLSTATE 23000) بود
     * که هیچ‌جا catch نمی‌شد و به کاربر یک ۵۰۰ عمومی («خطای داخلی سرور»)
     * نشان می‌داد، نه پیام روشن «قبلاً اضافه شده».
     */
    public function test_race_condition_insert_conflict_returns_409_not_500(): void
    {
        Wishlist::creating(function () {
            \Illuminate\Support\Facades\DB::table('wishlists')->insert([
                'user_id' => $this->user->id,
                'product_id' => $this->product->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        try {
            $response = $this->actingAs($this->user)
                ->postJson('/api/v1/wishlist', ['product_id' => $this->product->id]);

            $response->assertStatus(409);
            $response->assertJsonPath('success', false);
            $response->assertJsonPath('code', 'ALREADY_WISHLISTED');
            $this->assertSame(1, Wishlist::where('user_id', $this->user->id)->count());
        } finally {
            \Illuminate\Support\Facades\Event::forget('eloquent.creating: '.Wishlist::class);
        }
    }

    public function test_adding_nonexistent_product_fails_validation(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/v1/wishlist', ['product_id' => 999999])
            ->assertStatus(422);
    }

    public function test_wishlist_only_shows_own_items(): void
    {
        $otherProduct = Product::factory()->create();
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);
        Wishlist::create(['user_id' => $this->otherUser->id, 'product_id' => $otherProduct->id]);

        $response = $this->actingAs($this->user)->getJson('/api/v1/wishlist');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
        $this->assertSame($this->product->id, $response->json('data.data.0.product_id'));
    }

    public function test_user_can_remove_own_item(): void
    {
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/wishlist/{$this->product->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_user_cannot_remove_another_users_item(): void
    {
        Wishlist::create(['user_id' => $this->otherUser->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/v1/wishlist/{$this->product->id}")
            ->assertStatus(404);

        // The other user's row must survive.
        $this->assertDatabaseHas('wishlists', [
            'user_id' => $this->otherUser->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_check_reports_wishlisted_state_per_user(): void
    {
        Wishlist::create(['user_id' => $this->user->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->user)
            ->getJson("/api/v1/wishlist/check/{$this->product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.is_wishlisted', true);

        $this->actingAs($this->otherUser)
            ->getJson("/api/v1/wishlist/check/{$this->product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.is_wishlisted', false);
    }
}
