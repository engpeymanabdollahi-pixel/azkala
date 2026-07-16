<?php

namespace Tests\Unit\Services;

use App\Models\Seller;
use App\Services\ProximitySearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProximitySearchServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProximitySearchService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ProximitySearchService::class);
    }

    public function test_find_sellers_within_radius(): void
    {
        // موقعیت کاربر: تهران، میدان ونک (فرضی: 35.72, 51.40)
        $userLat = 35.7200;
        $userLng = 51.4000;

        // فروشنده نزدیک (ونک)
        $nearSeller = Seller::factory()->create([
            'name' => 'Mobile Shop Venak',
            'latitude' => 35.7210,
            'longitude' => 51.4010,
            'is_active' => true
        ]);

        // فروشنده دور (کرج)
        $farSeller = Seller::factory()->create([
            'name' => 'Mobile Shop Karaj',
            'latitude' => 35.8000,
            'longitude' => 50.9000,
            'is_active' => true
        ]);

        $results = $this->service->findNearby($userLat, $userLng, 5); // شعاع 5 کیلومتر

        $this->assertContains($nearSeller->id, $results->pluck('id'));
        $this->assertNotContains($farSeller->id, $results->pluck('id'));
        $this->assertEquals(1, $results->count());
    }
}