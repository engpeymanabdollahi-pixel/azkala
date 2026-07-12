<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * دریافت سبد خرید کاربر
     */
    public function index(Request $request)
    {
        try {
            $cart = Cart::with(['items.product.category', 'items.product.brand'])
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$cart) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'items' => [],
                        'subtotal' => 0,
                        'discount' => 0,
                        'total' => 0,
                        'items_count' => 0,
                    ],
                ]);
            }

            // به‌روزرسانی قیمت‌ها از محصول (در صورت تغییر)
            foreach ($cart->items as $item) {
                if ($item->product) {
                    $currentPrice = $item->product->discount_price ?? $item->product->price;
                    if ((float) $item->price !== (float) $currentPrice) {
                        $item->price = $currentPrice;
                        $item->save();
                    }
                }
            }

            // بارگذاری مجدد برای محاسبه مجدد accessor ها
            $cart->load('items');

            return response()->json([
                'success' => true,
                'data' => [
                    'items' => $cart->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_id' => $item->product_id,
                            'quantity' => $item->quantity,
                            'price' => (float) $item->price,
                            'total' => $item->total, // از accessor محاسبه می‌شود
                            'in_stock' => $item->hasEnoughStock(),
                            'available_stock' => $item->product?->stock ?? 0,
                            'product' => $item->product ? [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'slug' => $item->product->slug,
                                'main_image' => $item->product->main_image,
                                'stock' => $item->product->stock,
                                'is_active' => $item->product->is_active,
                                'seller_id' => $item->product->seller_id,
                                'category' => $item->product->category ? [
                                    'id' => $item->product->category->id,
                                    'name' => $item->product->category->name,
                                ] : null,
                                'brand' => $item->product->brand ? [
                                    'id' => $item->product->brand->id,
                                    'name' => $item->product->brand->name,
                                ] : null,
                            ] : null,
                        ];
                    }),
                    'subtotal' => $cart->subtotal,      // از accessor
                    'discount' => 0,                     // فعلاً تخفیف نداریم
                    'total' => $cart->subtotal,          // فعلاً = subtotal
                    'items_count' => $cart->total_items, // از accessor
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('CartController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت سبد خرید',
            ], 500);
        }
    }

    /**
     * افزودن محصول به سبد
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|integer|min:1',
            ]);

            $product = Product::findOrFail($request->product_id);

            if ($product->stock < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'موجودی کافی نیست',
                ], 400);
            }

            return DB::transaction(function () use ($request, $product) {
                // ✅ فقط user_id در fillable است
                $cart = Cart::firstOrCreate(
                    ['user_id' => $request->user()->id]
                );

                $cartItem = $cart->items()
                    ->where('product_id', $product->id)
                    ->first();

                if ($cartItem) {
                    $newQuantity = $cartItem->quantity + $request->quantity;
                    
                    if ($product->stock < $newQuantity) {
                        return response()->json([
                            'success' => false,
                            'message' => 'موجودی کافی نیست',
                        ], 400);
                    }

                    $cartItem->quantity = $newQuantity;
                    // به‌روزرسانی قیمت
                    $cartItem->price = $product->discount_price ?? $product->price;
                    $cartItem->save();
                } else {
                    // ✅ فقط فیلدهای موجود در $fillable
                    $cart->items()->create([
                        'product_id' => $product->id,
                        'quantity' => $request->quantity,
                        'price' => $product->discount_price ?? $product->price,
                    ]);
                }

                // بارگذاری مجدد برای محاسبه accessor ها
                $cart->load('items');

                return response()->json([
                    'success' => true,
                    'message' => 'محصول به سبد خرید اضافه شد',
                    'data' => [
                        'items_count' => $cart->total_items,  // از accessor
                        'total' => (float) $cart->subtotal,   // از accessor
                    ],
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('CartController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در افزودن به سبد خرید',
            ], 500);
        }
    }

    /**
     * به‌روزرسانی تعداد یک آیتم
     */
    public function update(Request $request, $itemId)
    {
        try {
            $request->validate([
                'quantity' => 'required|integer|min:1',
            ]);

            $cart = Cart::where('user_id', $request->user()->id)->first();

            if (!$cart) {
                return response()->json([
                    'success' => false,
                    'message' => 'سبد خرید یافت نشد',
                ], 404);
            }

            $cartItem = $cart->items()->findOrFail($itemId);
            $product = $cartItem->product;

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'محصول یافت نشد',
                ], 404);
            }

            if ($product->stock < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'موجودی کافی نیست',
                ], 400);
            }

            $cartItem->quantity = $request->quantity;
            // به‌روزرسانی قیمت
            $cartItem->price = $product->discount_price ?? $product->price;
            $cartItem->save();

            // بارگذاری مجدد
            $cart->load('items');

            return response()->json([
                'success' => true,
                'message' => 'سبد خرید به‌روزرسانی شد',
                'data' => [
                    'items_count' => $cart->total_items,
                    'total' => (float) $cart->subtotal,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('CartController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در به‌روزرسانی',
            ], 500);
        }
    }

    /**
     * حذف یک آیتم از سبد
     */
    public function destroy(Request $request, $itemId)
    {
        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if (!$cart) {
                return response()->json([
                    'success' => false,
                    'message' => 'سبد خرید یافت نشد',
                ], 404);
            }

            $cartItem = $cart->items()->findOrFail($itemId);
            $cartItem->delete();

            // بارگذاری مجدد
            $cart->load('items');

            return response()->json([
                'success' => true,
                'message' => 'محصول از سبد خرید حذف شد',
                'data' => [
                    'items_count' => $cart->total_items,
                    'total' => (float) $cart->subtotal,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('CartController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف',
            ], 500);
        }
    }

    /**
     * خالی کردن کامل سبد
     */
    public function clear(Request $request)
    {
        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if ($cart) {
                $cart->items()->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'سبد خرید خالی شد',
            ]);
        } catch (\Exception $e) {
            Log::error('CartController@clear: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در خالی کردن',
            ], 500);
        }
    }
}