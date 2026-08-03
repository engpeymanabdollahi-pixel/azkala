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

        return response()->json([
            'success' => true,
            'data' => $cart->load('items.product'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'device_model_id' => 'nullable|integer|exists:device_models,id',
        ]);

        try {
            $cart = $this->cartService->getOrCreateCart(Auth::id(), session()->getId());
            
            $cartItem = $this->cartService->addItem(
                $cart,
                $validated['product_id'],
                $validated['quantity'],
                $validated['device_model_id'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت به سبد خرید اضافه شد.',
                'data' => $cartItem->load('product'),
            ], 201);

        } catch (OutOfStockException|IncompatibleProductException $e) { // ✅ خلاصه‌سازی با Union Type
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
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
}