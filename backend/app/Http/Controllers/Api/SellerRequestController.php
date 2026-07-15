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
        $validated = $request->validate([
            'shop_name' => 'required|string|max:255',
            'national_code' => 'required|string|max:15',
            'description' => 'nullable|string|max:1000',
        ]);

        try {
            $userId = $request->user()->id;

            // بررسی درخواست تکراری در حال بررسی
            $existingRequest = SellerRequest::where('user_id', $userId)
                ->where('status', 'pending')
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما قبلاً یک درخواست فروشندگی ثبت کرده‌اید که در حال بررسی است.'
                ], 400);
            }

            $sellerRequest = SellerRequest::create([
                'user_id' => $userId,
                'shop_name' => $validated['shop_name'],
                'national_code' => $validated['national_code'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'درخواست شما با موفقیت ثبت شد. پس از بررسی با شما تماس خواهیم گرفت.',
                'data' => $sellerRequest
            ], 201);

        } catch (\Exception $e) {
            Log::error('SellerRequestController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.'
            ], 500);
        }
    }
}