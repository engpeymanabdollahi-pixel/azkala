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
            'store_name' => 'required|string|max:255',
            'phone' => 'required|string',
            'email' => 'required|email',
            'description' => 'required|string',
        ]);

        try {
            // بررسی اینکه آیا کاربر قبلاً درخواست داده است یا خیر
            $existingRequest = \App\Models\SellerRequest::where('user_id', auth()->id())
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'شما قبلاً درخواست فروشندگی ثبت کرده‌اید و در حال بررسی است.'
                ], 400);
            }

            // ایجاد درخواست جدید
            $sellerRequest = \App\Models\SellerRequest::create([
                'user_id' => auth()->id(),
                'store_name' => $validated['store_name'],
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                'description' => $validated['description'],
                'status' => 'pending', // وضعیت پیش‌فرض
            ]);

            return response()->json([
                'success' => true,
                'message' => 'درخواست شما با موفقیت ثبت شد و پس از بررسی نتیجه اعلام می‌گردد.',
                'data' => $sellerRequest
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SellerRequestController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.'
            ], 500);
        }
    }
}