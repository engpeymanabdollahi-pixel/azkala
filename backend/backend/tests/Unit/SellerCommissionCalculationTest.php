<?php

namespace Tests\Unit\Services;

use App\Models\Seller;
use App\Models\Order;
use App\Services\CommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerCommissionCalculationTest extends TestCase
{
    use RefreshDatabase;

    private CommissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(CommissionService::class);
    }

    public function test_commission_rate_based_on_subscription_tier(): void
    {
        // فروشنده برنزی (کمیسیون ۱۵٪)
        $bronzeSeller = Seller::factory()->create(['subscription_tier' => 'bronze']);
        $orderAmount = 1000000;

        $commission = $this->service->calculate($orderAmount, $bronzeSeller);

        $this->assertEquals(150000, $commission); // 15%
        $this->assertEquals(850000, $orderAmount - $commission); // سود خالص فروشنده

        // فروشنده طلایی (کمیسیون ۵٪)
        $goldSeller = Seller::factory()->create(['subscription_tier' => 'gold']);
        $commissionGold = $this->service->calculate($orderAmount, $goldSeller);

        $this->assertEquals(50000, $commissionGold); // 5%
    }

    public function test_minimum_commission_applied(): void
    {
        $seller = Seller::factory()->create(['subscription_tier' => 'gold']);
        $smallOrderAmount = 10000; // 5% میشه 500 تومان، اما حداقل کمیسیون 5000 تومان است

        $commission = $this->service->calculate($smallOrderAmount, $seller);

        $this->assertEquals(5000, $commission); // اعمال کف کمیسیون
    }
}