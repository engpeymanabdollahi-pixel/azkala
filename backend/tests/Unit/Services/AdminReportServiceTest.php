<?php

namespace Tests\Unit\Services;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Repositories\AdminReportRepository;
use App\Services\Admin\AdminReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReportServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AdminReportService $service;
    protected AdminReportRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new AdminReportRepository();
        $this->service = new AdminReportService($this->repository);
    }

    // ==================== getOverview Tests ====================

    public function test_can_get_overview(): void
    {
        // ایجاد داده تست
        User::factory()->count(5)->create(['role' => 'customer']);
        Product::factory()->count(10)->create();
        Order::factory()->count(8)->create(['status' => 'completed']);

        $overview = $this->service->getOverview();

        $this->assertIsArray($overview);
        $this->assertNotEmpty($overview);
    }

    public function test_overview_returns_correct_structure(): void
    {
        $overview = $this->service->getOverview();

        $this->assertIsArray($overview);
        $this->assertNotEmpty($overview);
    }

    public function test_overview_with_no_data(): void
    {
        $overview = $this->service->getOverview();

        $this->assertIsArray($overview);
        $this->assertNotEmpty($overview);
    }

    // ==================== getDashboardKPIs Tests ====================

    public function test_can_get_dashboard_kpis(): void
    {
        Order::factory()->count(10)->create([
            'status' => 'completed',
            'created_at' => now()->subDays(15),
        ]);

        $kpis = $this->service->getDashboardKPIs(30);

        $this->assertIsArray($kpis);
        $this->assertNotEmpty($kpis);
    }

    public function test_dashboard_kpis_with_custom_period(): void
    {
        Order::factory()->count(5)->create([
            'status' => 'completed',
            'created_at' => now()->subDays(7),
        ]);

        $kpis = $this->service->getDashboardKPIs(7);

        $this->assertIsArray($kpis);
        $this->assertNotEmpty($kpis);
    }

    public function test_dashboard_kpis_with_no_data(): void
    {
        $kpis = $this->service->getDashboardKPIs(30);

        $this->assertIsArray($kpis);
        $this->assertNotEmpty($kpis);
    }

    // ==================== getSalesChart Tests ====================

    public function test_can_get_sales_chart(): void
    {
        Order::factory()->count(10)->create([
            'status' => 'completed',
            'created_at' => now()->subDays(10),
        ]);

        $chart = $this->service->getSalesChart(30);

        $this->assertIsArray($chart);
        $this->assertNotEmpty($chart);
    }

    public function test_sales_chart_with_custom_period(): void
    {
        Order::factory()->count(5)->create([
            'status' => 'completed',
            'created_at' => now()->subDays(3),
        ]);

        $chart = $this->service->getSalesChart(7);

        $this->assertIsArray($chart);
        $this->assertNotEmpty($chart);
    }

    public function test_sales_chart_returns_data_structure(): void
    {
        $chart = $this->service->getSalesChart(30);

        $this->assertIsArray($chart);
        $this->assertNotEmpty($chart);
    }

    // ==================== getTopProducts Tests ====================

    public function test_can_get_top_products(): void
    {
        $products = Product::factory()->count(5)->create();
        
        foreach ($products as $product) {
            Order::factory()->count(3)->create([
                'status' => 'completed',
                'created_at' => now()->subDays(10),
            ]);
        }

        $topProducts = $this->service->getTopProducts(30, 10);

        $this->assertIsArray($topProducts);
    }

    public function test_top_products_with_custom_limit(): void
    {
        Product::factory()->count(15)->create();

        $topProducts = $this->service->getTopProducts(30, 5);

        $this->assertIsArray($topProducts);
    }

    public function test_top_products_with_no_data(): void
    {
        $topProducts = $this->service->getTopProducts(30, 10);

        $this->assertIsArray($topProducts);
    }

    // ==================== getTopCategories Tests ====================

    public function test_can_get_top_categories(): void
    {
        $categories = Category::factory()->count(5)->create();
        
        foreach ($categories as $category) {
            $products = Product::factory()->count(3)->create(['category_id' => $category->id]);
            
            foreach ($products as $product) {
                Order::factory()->count(2)->create([
                    'status' => 'completed',
                    'created_at' => now()->subDays(10),
                ]);
            }
        }

        $topCategories = $this->service->getTopCategories(30);

        $this->assertIsArray($topCategories);
    }

    public function test_top_categories_with_no_data(): void
    {
        $topCategories = $this->service->getTopCategories(30);

        $this->assertIsArray($topCategories);
    }

    // ==================== getOrderStatus Tests ====================

    public function test_can_get_order_status(): void
    {
        Order::factory()->count(5)->create(['status' => 'completed']);
        Order::factory()->count(3)->create(['status' => 'pending']);
        Order::factory()->count(2)->create(['status' => 'cancelled']);

        $status = $this->service->getOrderStatus(30);

        $this->assertIsArray($status);
        $this->assertNotEmpty($status);
    }

    public function test_order_status_with_custom_period(): void
    {
        Order::factory()->count(5)->create([
            'status' => 'completed',
            'created_at' => now()->subDays(5),
        ]);

        $status = $this->service->getOrderStatus(7);

        $this->assertIsArray($status);
        $this->assertNotEmpty($status);
    }

    public function test_order_status_with_no_data(): void
    {
        $status = $this->service->getOrderStatus(30);

        $this->assertIsArray($status);
    }

    // ==================== getTopSellers Tests ====================

    public function test_can_get_top_sellers(): void
    {
        $sellers = User::factory()->count(5)->create(['role' => 'seller']);
        
        foreach ($sellers as $seller) {
            $products = Product::factory()->count(3)->create(['seller_id' => $seller->id]);
            
            foreach ($products as $product) {
                Order::factory()->count(2)->create([
                    'status' => 'completed',
                    'created_at' => now()->subDays(10),
                ]);
            }
        }

        $topSellers = $this->service->getTopSellers(30);

        $this->assertIsArray($topSellers);
    }

    public function test_top_sellers_with_no_data(): void
    {
        $topSellers = $this->service->getTopSellers(30);

        $this->assertIsArray($topSellers);
    }
}