<?php

namespace Tests\Unit\Services;

use App\Models\Seller;
use App\Services\SellerCommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerCommissionCalculationTest extends TestCase
{
    use RefreshDatabase;

    private SellerCommissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(SellerCommissionService::class);
    }

    public function test_bronze_seller_pays_higher_commission(): void
    {
        $seller = Seller::factory()->create(['tier' => 'bronze']); // فرض: 15% کمیسیون
        $saleAmount = 1000000;

        $commission = $this->service->calculate($seller, $saleAmount);

        $this->assertEquals(150000, $commission); // 15%
        $this->assertEquals(850000, $saleAmount - $commission);
    }

    public function test_gold_seller_pays_lower_commission(): void
    {
        $seller = Seller::factory()->create(['tier' => 'gold']); // فرض: 5% کمیسیون
        $saleAmount = 1000000;

        $commission = $this->service->calculate($seller, $saleAmount);

        $this->assertEquals(50000, $commission); // 5%
        $this->assertEquals(950000, $saleAmount - $commission);
    }
}