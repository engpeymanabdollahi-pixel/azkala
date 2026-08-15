<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Services\CartService;
use App\Services\Order\OrderService;
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

           // در متد store، بعد از ساخت سفارش:
return response()->json([
    'success' => true,
    'message' => 'سفارش شما با موفقیت ثبت شد.',
    'data' => [
        'order_number' => $order->order_number,
        'total' => (float) $order->total,
        'items_count' => $order->items->sum('quantity'), // ✅ اضافه شد
        'payment_method' => $order->payment_method,     // ✅ اضافه شد
        'shipping_address' => $order->shipping_address, // ✅ اضافه شد
        'created_at' => $order->created_at,             // ✅ اضافه شد
        'payment_url' => '/api/payment/initiate/' . $order->id
    ]
], 201);

        } catch (\App\Exceptions\OutOfStockException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
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

           /**
     * نمایش جزئیات یک سفارش خاص
     */
    public function show(Order $order)
    {
        // ✅ خط جادویی: اگر کاربر ادمین نباشد و owner سفارش نباشد، ۴۰۳ Forbidden برمی‌گرداند
        $this->authorize('view', $order);

        return response()->json([
            'success' => true,
            'data' => $order->load('items.product'),
        ]);
    }

    /**
     * لغو سفارش توسط کاربر
     */
    public function cancel(Order $order)
    {
        // ✅ بررسی Policy: آیا این کاربر مجاز به لغو این سفارش خاص است؟
        $this->authorize('cancel', $order);

        try {
            // ✅ CONFIRMED BUG (Backend Full Audit): قبلاً اینجا
            // app(\App\Services\OrderService::class) صدا زده می‌شد —
            // یعنی namespace نادرست (App\Services\OrderService، بدون
            // زیرپوشه‌ی Order\)؛ چنین کلاسی اصلاً وجود ندارد. نتیجه:
            // BindingResolutionException در همان لحظه‌ی resolve، یعنی
            // هر درخواست واقعی به این endpoint با ۵۰۰ رد می‌شد — لغو
            // سفارش برای هیچ کاربری کار نمی‌کرد (بازتولید شد: تست HTTP
            // واقعی روی این route دقیقاً همین خطا را داد). سرویس درستِ
            // تزریق‌شده (همین‌جا در constructor، با namespace صحیح)
            // همیشه در دسترس بود؛ فقط استفاده نمی‌شد.
            //
            // امضای واقعی OrderService::cancelOrder(int $orderId, int
            // $userId): bool هم با فراخوانی قبلی (که کل مدل $order را
            // پاس می‌داد و منتظر برگشتِ همان مدل بود) ناسازگار بود؛
            // خروجی واقعی boolean است، نه یک Order — دقیقاً همان چیزی که
            // order.service.ts فرانت‌اند هم انتظار دارد
            // ({success, message}, بدون فیلد data).
            $this->orderService->cancelOrder((int) $order->id, (int) Auth::id());

            return response()->json([
                'success' => true,
                'message' => 'سفارش با موفقیت لغو شد.',
            ]);
        } catch (\Exception $e) {
            // ✅ OrderService::cancelOrder برای «یافت نشد»/«قابل لغو نیست»
            // \Exception($message, $httpCode) می‌اندازد (نه
            // InvalidArgumentException — catch قبلی هرگز این‌ها را
            // نمی‌گرفت)؛ همان الگوی نگاشت code→status که در
            // AdminAccessController این پروژه هم استفاده می‌شود.
            $status = $e->getCode();
            $status = ($status >= 400 && $status < 600) ? $status : 400;

            return response()->json(['success' => false, 'message' => $e->getMessage()], $status);
        }
    }
}