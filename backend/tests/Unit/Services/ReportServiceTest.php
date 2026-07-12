<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\Admin\ReportService;
use App\Repositories\AdminRepository;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

class ReportServiceTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    protected $service;
    protected $repository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = Mockery::mock(AdminRepository::class);
        $this->service = new ReportService($this->repository);
    }

    // ==================== getUsersAnalysis Tests ====================

    public function test_can_get_users_analysis(): void
    {
        $expectedData = [
            'new_vs_returning' => ['new' => 50, 'returning' => 150],
            'retention_rate' => 75.0,
            'total_customers' => 200,
        ];

        $this->repository
            ->shouldReceive('getUsersAnalysis')
            ->with('2026-06-12', '2026-07-12')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getUsersAnalysis('2026-06-12', '2026-07-12');

        $this->assertIsArray($result);
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('period', $result);
        $this->assertEquals($expectedData, $result['data']);
        $this->assertEquals('2026-06-12', $result['period']['start_date']);
        $this->assertEquals('2026-07-12', $result['period']['end_date']);
    }

    public function test_users_analysis_with_null_dates(): void
    {
        $expectedData = ['total_customers' => 100];

        $this->repository
            ->shouldReceive('getUsersAnalysis')
            ->with(null, null)
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getUsersAnalysis(null, null);

        $this->assertTrue($result['success']);
        $this->assertNull($result['period']['start_date']);
    }

    // ==================== getSellerPerformance Tests ====================

    public function test_can_get_seller_performance(): void
    {
        $expectedData = [
            ['id' => 1, 'name' => 'Seller 1', 'total_revenue' => 50000000],
            ['id' => 2, 'name' => 'Seller 2', 'total_revenue' => 40000000],
        ];

        $this->repository
            ->shouldReceive('getSellerPerformance')
            ->with('2026-06-12', '2026-07-12', null)
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getSellerPerformance('2026-06-12', '2026-07-12', null);

        $this->assertIsArray($result);
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('total_sellers', $result);
        $this->assertEquals(2, $result['total_sellers']);
    }

    public function test_seller_performance_with_specific_seller(): void
    {
        $expectedData = [['id' => 5, 'name' => 'Seller 5']];

        $this->repository
            ->shouldReceive('getSellerPerformance')
            ->with('2026-06-12', '2026-07-12', 5)
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getSellerPerformance('2026-06-12', '2026-07-12', 5);

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['total_sellers']);
    }

    // ==================== getPeriodComparison Tests ====================

    public function test_can_get_period_comparison(): void
    {
        $expectedData = [
            'current' => ['orders' => 100, 'revenue' => 5000000],
            'previous' => ['orders' => 80, 'revenue' => 4000000],
        ];

        $this->repository
            ->shouldReceive('getPeriodComparison')
            ->with('2026-06-12', '2026-07-12', '2026-05-13', '2026-06-12')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getPeriodComparison(
            '2026-06-12', '2026-07-12',
            '2026-05-13', '2026-06-12'
        );

        $this->assertTrue($result['success']);
        $this->assertEquals($expectedData, $result['data']);
    }

    public function test_period_comparison_throws_exception_for_invalid_dates(): void
    {
        $this->expectException(\Exception::class);
        
        $this->service->getPeriodComparison(
            'invalid-date', '2026-07-12',
            '2026-05-13', '2026-06-12'
        );
    }

    // ==================== getDeviceAnalytics Tests ====================

    public function test_can_get_device_analytics(): void
    {
        $expectedData = [
            'by_brand' => [['device_brand' => 'Samsung', 'count' => 500]],
            'by_model' => [['device_model' => 'S24 Ultra', 'count' => 200]],
        ];

        $this->repository
            ->shouldReceive('getDeviceAnalytics')
            ->with('2026-06-12', '2026-07-12')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getDeviceAnalytics('2026-06-12', '2026-07-12');

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('by_brand', $result['data']);
        $this->assertArrayHasKey('by_model', $result['data']);
    }

    // ==================== getBasketAnalysis Tests ====================

    public function test_can_get_basket_analysis(): void
    {
        $expectedData = [
            'avg_items_per_order' => 3.5,
            'avg_order_value' => 2500000,
            'frequently_bought' => [],
        ];

        $this->repository
            ->shouldReceive('getBasketAnalysis')
            ->with('2026-06-12', '2026-07-12')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getBasketAnalysis('2026-06-12', '2026-07-12');

        $this->assertTrue($result['success']);
        $this->assertEquals(3.5, $result['data']['avg_items_per_order']);
    }

    // ==================== getSearchAnalytics Tests ====================

    public function test_can_get_search_analytics(): void
    {
        $expectedData = [
            'top_searches' => [
                ['term' => 'قاب گوشی', 'count' => 1000],
                ['term' => 'شارژر', 'count' => 800],
            ],
        ];

        $this->repository
            ->shouldReceive('getSearchAnalytics')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getSearchAnalytics();

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('top_searches', $result['data']);
    }

    // ==================== getProductAnalytics Tests ====================

    public function test_can_get_product_analytics(): void
    {
        $expectedData = [
            'most_viewed' => [['id' => 1, 'name' => 'Product 1']],
            'high_conversion' => [['id' => 2, 'name' => 'Product 2']],
            'low_stock' => [],
        ];

        $this->repository
            ->shouldReceive('getProductAnalytics')
            ->with('2026-06-12', '2026-07-12')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getProductAnalytics('2026-06-12', '2026-07-12');

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('most_viewed', $result['data']);
        $this->assertArrayHasKey('high_conversion', $result['data']);
        $this->assertArrayHasKey('low_stock', $result['data']);
    }

    // ==================== getPredictions Tests ====================

    public function test_can_get_predictions(): void
    {
        $expectedData = [
            'predictions' => [
                ['date' => '2026-07-13', 'predicted_revenue' => 5000000],
                ['date' => '2026-07-14', 'predicted_revenue' => 5500000],
            ],
            'current_avg' => 5000000,
            'trend' => 'up',
        ];

        $this->repository
            ->shouldReceive('getPredictions')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getPredictions();

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('generated_at', $result);
        $this->assertArrayHasKey('data', $result);
    }

    // ==================== getAnomalies Tests ====================

    public function test_can_get_anomalies(): void
    {
        $expectedData = [
            ['date' => '2026-07-01', 'type' => 'spike', 'deviation' => 150],
            ['date' => '2026-07-05', 'type' => 'drop', 'deviation' => -80],
        ];

        $this->repository
            ->shouldReceive('getAnomalies')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getAnomalies();

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('total_anomalies', $result);
        $this->assertEquals(2, $result['total_anomalies']);
        $this->assertArrayHasKey('generated_at', $result);
    }

    public function test_anomalies_returns_zero_when_empty(): void
    {
        $this->repository
            ->shouldReceive('getAnomalies')
            ->once()
            ->andReturn([]);

        $result = $this->service->getAnomalies();

        $this->assertTrue($result['success']);
        $this->assertEquals(0, $result['total_anomalies']);
    }

    // ==================== getChatAnalytics Tests ====================

    public function test_can_get_chat_analytics(): void
    {
        $expectedData = [
            'total_conversations' => 500,
            'active_conversations' => 20,
            'total_messages' => 5000,
        ];

        $this->repository
            ->shouldReceive('getChatAnalytics')
            ->with('2026-06-12', '2026-07-12')
            ->once()
            ->andReturn($expectedData);

        $result = $this->service->getChatAnalytics('2026-06-12', '2026-07-12');

        $this->assertTrue($result['success']);
        $this->assertEquals(500, $result['data']['total_conversations']);
    }

    // ==================== Exception Handling Tests ====================

    public function test_get_users_analysis_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getUsersAnalysis')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getUsersAnalysis('2026-06-12', '2026-07-12');
    }

    public function test_get_seller_performance_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getSellerPerformance')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getSellerPerformance('2026-06-12', '2026-07-12', null);
    }

    public function test_get_device_analytics_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getDeviceAnalytics')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getDeviceAnalytics('2026-06-12', '2026-07-12');
    }

    public function test_get_basket_analysis_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getBasketAnalysis')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getBasketAnalysis('2026-06-12', '2026-07-12');
    }

    public function test_get_search_analytics_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getSearchAnalytics')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getSearchAnalytics();
    }

    public function test_get_product_analytics_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getProductAnalytics')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getProductAnalytics('2026-06-12', '2026-07-12');
    }

    public function test_get_predictions_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getPredictions')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getPredictions();
    }

    public function test_get_anomalies_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getAnomalies')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getAnomalies();
    }

    public function test_get_chat_analytics_throws_exception_on_error(): void
    {
        $this->repository
            ->shouldReceive('getChatAnalytics')
            ->andThrow(new \Exception('Database error'));

        $this->expectException(\Exception::class);
        
        $this->service->getChatAnalytics('2026-06-12', '2026-07-12');
    }
}