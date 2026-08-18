<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\IncompatibleProductException;
use App\Exceptions\OutOfStockException;
use App\Http\Controllers\Controller;
use App\Services\CartService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    // ✅ استفاده از Constructor Property Promotion برای خلاصه‌نویسی
    public function __construct(protected CartService $cartService) {}

    public function index()
    {
        $user = Auth::user();
        $cart = $this->cartService->getOrCreateCart($user?->id, session()->getId());

        // ✅ Variant/Color System فاز ۳: items.variant هم eager-load شد تا
        // فرانت‌اند بتواند رنگ انتخاب‌شده‌ی هر آیتم را بدون کوئری اضافه
        // به‌ازای هر ردیف نمایش دهد (پیشگیری N+1، دقیقاً همان دلیل
        // items.product که از قبل بود).
        return response()->json([
            'success' => true,
            'data' => $cart->load(['items.product', 'items.variant']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'device_model_id' => 'nullable|integer|exists:device_models,id',
            // ✅ Variant/Color System فاز ۳: کاملاً اختیاری — عدم ارسال یعنی
            // محصول بدون رنگ (legacy)، دقیقاً همان رفتار قبلی. صحت واقعیِ
            // «این variant متعلق به این product است» در CartService (نه
            // اینجا) با کوئری مستقیم به دیتابیس سنجیده می‌شود، نه فقط
            // exists:product_variants,id — چون IDOR واقعی این است که
            // variant_id معتبر باشد ولی متعلق به محصول دیگری.
            'variant_id' => 'nullable|integer|exists:product_variants,id',
        ]);

        try {
            $cart = $this->cartService->getOrCreateCart(Auth::id(), session()->getId());

            $cartItem = $this->cartService->addItem(
                $cart,
                $validated['product_id'],
                $validated['quantity'],
                $validated['device_model_id'] ?? null,
                $validated['variant_id'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت به سبد خرید اضافه شد.',
                'data' => $cartItem->load(['product', 'variant']),
            ], 201);

        } catch (OutOfStockException|IncompatibleProductException $e) { // ✅ خلاصه‌سازی با Union Type
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\InvalidArgumentException $e) {
            // ✅ فاز ۳: شامل خطای IDOR «رنگ متعلق به این محصول نیست» —
            // یک خطای کلاینت واقعی است، نه سرور (نباید 500 بدهد).
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا در افزودن به سبد خرید.'], 500);
        }
    }

    public function update(Request $request, int $cartItemId)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        try {
            $cart = $this->cartService->getOrCreateCart(Auth::id(), session()->getId());

            // ✅ حذف خط اضافی findOrFail: سرویس خودش این بررسی امنیتی را انجام می‌دهد
            
            $updatedItem = $this->cartService->updateItemQuantity($cart, $cartItemId, $validated['quantity']);

            return response()->json([
                'success' => true,
                'message' => 'تعداد محصول به‌روزرسانی شد.',
                'data' => $updatedItem,
            ]);

        } catch (OutOfStockException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'آیتم در سبد خرید یافت نشد.'], 404);
        }
    }

    public function destroy(int $cartItemId)
    {
        $cart = $this->cartService->getOrCreateCart(Auth::id(), session()->getId());
        $deleted = $this->cartService->removeItem($cart, $cartItemId);

        if ($deleted) {
            return response()->json(['success' => true, 'message' => 'محصول از سبد حذف شد.']);
        }

        return response()->json(['success' => false, 'message' => 'آیتم یافت نشد.'], 404);
    }

    /**
     * خالی کردن کامل سبد خرید.
     *
     * روت این متد در routes/api.php باید قبل از /{cartItemId} ثبت شود، وگرنه
     * wildcard زودتر match می‌شود و درخواست با «clear» به‌عنوان شناسه به
     * destroy() می‌رسد.
     */
    public function clear()
    {
        $cart = $this->cartService->getOrCreateCart(Auth::id(), session()->getId());
        $this->cartService->clearCart($cart);

        return response()->json(['success' => true, 'message' => 'سبد خرید خالی شد.']);
    }
}