<?php

namespace Tests\Unit\Services;

use App\Models\Order;
use App\Models\User;
use App\Services\OrderStateMachineService;
use App\Exceptions\InvalidOrderTransitionException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private OrderStateMachineService $stateMachine;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->stateMachine = app(OrderStateMachineService::class);
        $this->user = User::factory()->create();
    }

    public function test_can_transition_from_pending_to_paid(): void
    {
        $order = Order::factory()->create(['user_id' => $this->user->id, 'status' => 'pending']);

        $this->stateMachine->apply($order, 'pay');

        $this->assertEquals('paid', $order->fresh()->status);
    }

    public function test_cannot_skip_processing_stage(): void
    {
        // سفارش نباید مستقیم از pending به shipped برود
        $order = Order::factory()->create(['user_id' => $this->user->id, 'status' => 'pending']);

        $this->expectException(InvalidOrderTransitionException::class);

        $this->stateMachine->apply($order, 'ship');
    }

    public function test_cannot_cancel_completed_order(): void
    {
        $order = Order::factory()->create(['user_id' => $this->user->id, 'status' => 'completed']);

        $this->expectException(InvalidOrderTransitionException::class);

        $this->stateMachine->apply($order, 'cancel');
    }
}