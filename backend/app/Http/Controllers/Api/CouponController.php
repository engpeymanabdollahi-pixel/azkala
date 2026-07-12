<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CouponController extends Controller
{
    public function validateCoupon(Request $request)
    {
        try {
            $code = trim($request->input('code', ''));
            
            if (empty($code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'کد تخفیف الزامی است',
                ], 422);
            }

            $code = strtoupper($code);
            $userId = $request->user()->id;

            $coupon = Coupon::where('code', $code)->first();

            if (!$coupon) {
                return response()->json([
                    'success' => false,
                    'message' => 'کد تخفیف نامعتبر است',
                ], 404);
            }

            // استفاده از متد isValidFor که تست کردیم کار می‌کند
            $cart = Cart::with('items')->where('user_id', $userId)->first();
            $subtotal = 0;
            $productIds = [];
            
            if ($cart && $cart->items && $cart->items->count() > 0) {
                foreach ($cart->items as $item) {
                    $subtotal += $item->price * $item->quantity;
                    $productIds[] = $item->product_id;
                }
            }

            $validation = $coupon->isValidFor($userId, $subtotal, $productIds);

            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $validation['message'],
                ], 400);
            }

            $discountAmount = $coupon->calculateDiscount($subtotal);

            return response()->json([
                'success' => true,
                'data' => [
                    'coupon' => [
                        'id' => $coupon->id,
                        'code' => $coupon->code,
                        'type' => $coupon->type,
                        'value' => (float) $coupon->value,
                        'description' => $coupon->description,
                        'max_discount' => $coupon->max_discount ? (float) $coupon->max_discount : null,
                    ],
                    'discount_amount' => (float) $discountAmount,
                    'message' => 'کد تخفیف با موفقیت اعمال شد',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('validateCoupon ERROR: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            
            return response()->json([
                'success' => false,
                'message' => 'خطا: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function myCoupons()
    {
        try {
            $coupons = Coupon::where('is_active', true)
                ->where('applicable_to', 'all')
                ->select('id', 'code', 'type', 'value', 'min_order_amount', 
                         'max_discount', 'end_date', 'description')
                ->get();

            return response()->json(['success' => true, 'data' => $coupons]);
        } catch (\Exception $e) {
            Log::error('myCoupons: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function index()
    {
        try {
            $coupons = Coupon::orderByDesc('created_at')->paginate(20);
            return response()->json(['success' => true, 'data' => $coupons]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|max:50|unique:coupons,code',
                'type' => 'required|in:percentage,fixed',
                'value' => 'required|numeric|min:0',
                'min_order_amount' => 'nullable|numeric|min:0',
                'max_discount' => 'nullable|numeric|min:0',
                'usage_limit' => 'nullable|integer|min:1',
                'usage_limit_per_user' => 'nullable|integer|min:1',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'description' => 'nullable|string|max:500',
            ]);

            $coupon = Coupon::create([
                'code' => strtoupper(trim($validated['code'])),
                'type' => $validated['type'],
                'value' => $validated['value'],
                'min_order_amount' => $validated['min_order_amount'] ?? 0,
                'max_discount' => $validated['max_discount'] ?? null,
                'usage_limit' => $validated['usage_limit'] ?? null,
                'usage_limit_per_user' => $validated['usage_limit_per_user'] ?? 1,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'description' => $validated['description'] ?? null,
                'applicable_to' => 'all',
                'created_by' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'ایجاد شد',
                'data' => $coupon,
            ], 201);
        } catch (\Exception $e) {
            Log::error('store: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function show($id)
    {
        try {
            return response()->json(['success' => true, 'data' => Coupon::findOrFail($id)]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'یافت نشد'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $coupon = Coupon::findOrFail($id);
            $coupon->update($request->only([
                'code', 'type', 'value', 'min_order_amount', 'max_discount',
                'usage_limit', 'usage_limit_per_user', 'start_date', 'end_date',
                'is_active', 'description'
            ]));
            return response()->json(['success' => true, 'message' => 'به‌روزرسانی شد', 'data' => $coupon]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Coupon::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'حذف شد']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }
}