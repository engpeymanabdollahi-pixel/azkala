<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected OrderService $orderService;
    protected CartService $cartService;

    public function __construct(OrderService $orderService, CartService $cartService)
    {
        $this->orderService = $orderService;
        $this->cartService = $cartService;
    }

    public function store(Request $request)
    {
        $request->validate([
            'shipping_address' => 'required|array',
            'shipping_address.receiver_name' => 'required|string',
            'shipping_address.phone' => 'required|string',
            'shipping_address.province' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.address' => 'required|string',
            'shipping_address.postal_code' => 'required|string',
            'payment_method' => 'required|string|in:online,wallet',
        ]);

        $user = Auth::user();
        $cart = $this->cartService->getOrCreateCart($user->id, session()->getId());

        try {
            $order = $this->orderService->createOrderFromCart(
                $user,
                $cart,
                $request->shipping_address,
                $request->payment_method
            );

            return response()->json([
                'success' => true,
                'message' => 'سفارش شما با موفقیت ثبت شد.',
                'data' => [
                    'order_number' => $order->order_number,
                    'total' => $order->total,
                    'payment_url' => '/api/payment/initiate/' . $order->id // لینک فرضی برای درگاه پرداخت
                ]
            ], 201);

        } catch (\App\Exceptions\OutOfStockException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطای غیرمنتظره در ثبت سفارش.'], 500);
        }
    }

    public function index()
    {
        $orders = Auth::user()->orders()->with('items.product')->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function show(Order $order)
    {
        // بررسی امنیت: کاربر فقط باید سفارش‌های خودش را ببیند
        if ($order->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'دسترسی غیرمجاز.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $order->load('items.product'),
        ]);
    }

    public function cancel(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'دسترسی غیرمجاز.'], 403);
        }

        try {
            $cancelledOrder = $this->orderService->cancelOrder($order);
            
            return response()->json([
                'success' => true,
                'message' => 'سفارش با موفقیت لغو و مبلغ (در صورت پرداخت) به کیف پول بازگردانده شد.',
                'data' => $cancelledOrder
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}