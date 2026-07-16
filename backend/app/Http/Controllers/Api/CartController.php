<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    protected CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    public function index()
    {
        $user = Auth::user();
        $cart = $this->cartService->getOrCreateCart($user?->id, session()->getId());
        $cart->load('items.product');

        return response()->json([
            'success' => true,
            'data' => $cart,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'device_model_id' => 'nullable|integer|exists:device_models,id',
        ]);

        try {
            $user = Auth::user();
            $cart = $this->cartService->getOrCreateCart($user?->id, session()->getId());
            
            $cartItem = $this->cartService->addItem(
                $cart, 
                $request->product_id, 
                $request->quantity, 
                $request->device_model_id
            );

            return response()->json([
                'success' => true,
                'message' => 'محصول با موفقیت به سبد خرید اضافه شد.',
                'data' => $cartItem->load('product'),
            ], 201);

        } catch (\App\Exceptions\OutOfStockException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\App\Exceptions\IncompatibleProductException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا در افزودن به سبد خرید.'], 500);
        }
    }

    public function update(Request $request, int $cartItemId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        try {
            $user = Auth::user();
            $cart = $this->cartService->getOrCreateCart($user?->id, session()->getId());
            
            // بررسی امنیت: مطمئن شویم آیتم متعلق به همین سبد است
            $item = $cart->items()->findOrFail($cartItemId);

            $updatedItem = $this->cartService->updateItemQuantity($cart, $cartItemId, $request->quantity);

            return response()->json([
                'success' => true,
                'message' => 'تعداد محصول به‌روزرسانی شد.',
                'data' => $updatedItem,
            ]);

        } catch (\App\Exceptions\OutOfStockException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'آیتم در سبد خرید یافت نشد.'], 404);
        }
    }

    public function destroy(int $cartItemId)
    {
        $user = Auth::user();
        $cart = $this->cartService->getOrCreateCart($user?->id, session()->getId());
        
        $deleted = $this->cartService->removeItem($cart, $cartItemId);

        if ($deleted) {
            return response()->json(['success' => true, 'message' => 'محصول از سبد حذف شد.']);
        }

        return response()->json(['success' => false, 'message' => 'آیتم یافت نشد.'], 404);
    }
}