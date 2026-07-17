<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SellerRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SellerRequestController extends Controller
{
       public function store(Request $request)
    {
        // ✅ اعتبارسنجی دقیقاً مطابق با فرم عالی شما
        $validated = $request->validate([
            'shop_name' => 'required|string|max:255',
            'national_code' => 'required|string|max:11',
            'phone' => 'required|string|max:11',
            'description' => 'nullable|string',
        ]);

        try {
            $userId = auth()->id();

            // بررسی درخواست تکراری
            $existingRequest = \App\Models\SellerRequest::where('user_id', $userId)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما قبلاً درخواست فروشندگی ثبت کرده‌اید و در حال بررسی است.'
                ], 400);
            }

            // ✅ ایجاد رکورد با نام فیلدهای صحیح
            $sellerRequest = \App\Models\SellerRequest::create([
                'user_id' => $userId,
                'shop_name' => $validated['shop_name'],
                'national_code' => $validated['national_code'],
                'phone' => $validated['phone'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'درخواست شما با موفقیت ثبت شد.',
                'data' => $sellerRequest
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطای اعتبارسنجی',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SellerRequest Store Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطای سرور در ثبت درخواست.'
            ], 500);
        }
    }
}