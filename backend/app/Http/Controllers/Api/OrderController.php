<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\DTOs\Order\CreateOrderDTO;
use App\Models\Cart;
use App\Services\Order\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * لیست سفارشات کاربر
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $perPage = (int) $request->get('per_page', 20);

            $orders = $this->orderService->getUserOrders($userId, $perPage);

            return response()->json([
                'success' => true,
                'data' => OrderResource::collection($orders),
            ]);
        } catch (\Exception $e) {
            Log::error('OrderController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت سفارشات',
            ], 500);
        }
    }

    /**
     * نمایش جزئیات یک سفارش
     */
    public function show(Request $request, $orderId)
    {
        try {
            $userId = $request->user()->id;
            $data = $this->orderService->getOrderDetails((int) $orderId, $userId);

            // If data contains an order, wrap it with OrderResource
            if (isset($data['order'])) {
                $data['order'] = new OrderResource($data['order']);
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * ایجاد سفارش جدید از سبد خرید
     */
    public function store(StoreOrderRequest $request)
    {
        try {
            $userId = $request->user()->id;
            $validated = $request->validated();

            // Get cart items
            $cart = Cart::with('items.product')->where('user_id', $userId)->first();

            if (!$cart || $cart->items->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'سبد خرید خالی است',
                ], 400);
            }

            // Prepare items for DTO
            $cartItems = $cart->items->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                ];
            })->toArray();

            // Create DTO
            $dto = CreateOrderDTO::fromRequest($request, $userId, $cartItems, $validated);

            // Create order
            $order = $this->orderService->createOrder($dto);

            // Load relations for OrderResource
            $order->load(['items.product', 'address', 'user', 'coupon']);

            return response()->json([
                'success' => true,
                'message' => 'سفارش با موفقیت ثبت شد',
                'data' => [
                    'order' => new OrderResource($order),
                ],
            ], 201);

        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;

            Log::error('OrderController@store: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * لغو سفارش
     */
    public function cancel(Request $request, $orderId)
    {
        try {
            $userId = $request->user()->id;

            $result = $this->orderService->cancelOrder((int) $orderId, $userId);

            return response()->json([
                'success' => true,
                'message' => 'سفارش با موفقیت لغو شد',
            ]);

        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}