<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\WalletTransactionService;
use App\Exceptions\InsufficientBalanceException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletTransactionServiceTest extends TestCase
{
    use RefreshDatabase;

    private WalletTransactionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(WalletTransactionService::class);
    }

    public function test_deposit_increases_balance(): void
    {
        $user = User::factory()->create(['wallet_balance' => 100000]);

        $this->service->deposit($user, 50000, 'Test Deposit');

        $this->assertEquals(150000, $user->fresh()->wallet_balance);
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $user->id,
            'amount' => 50000,
            'type' => 'deposit'
        ]);
    }

    public function test_withdraw_decreases_balance(): void
    {
        $user = User::factory()->create(['wallet_balance' => 100000]);

        $this->service->withdraw($user, 40000, 'Test Withdraw');

        $this->assertEquals(60000, $user->fresh()->wallet_balance);
    }

    public function test_withdraw_throws_exception_on_insufficient_balance(): void
    {
        $user = User::factory()->create(['wallet_balance' => 10000]);

        $this->expectException(InsufficientBalanceException::class);

        $this->service->withdraw($user, 20000, 'Invalid Withdraw');
        
        // اطمینان از اینکه موجودی تغییر نکرده است
        $this->assertEquals(10000, $user->fresh()->wallet_balance);
    }
}