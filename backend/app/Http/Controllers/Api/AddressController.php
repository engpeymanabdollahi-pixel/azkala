<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AddressController extends Controller
{
    /**
     * لیست آدرس‌های کاربر
     */
    public function index(Request $request)
    {
        try {
            $addresses = Address::where('user_id', $request->user()->id)
                ->orderByDesc('is_default')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $addresses,
            ]);
        } catch (\Exception $e) {
            Log::error('AddressController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در دریافت آدرس‌ها',
            ], 500);
        }
    }

    /**
     * افزودن آدرس جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'province' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'address' => 'required|string',
            'postal_code' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        try {
            return DB::transaction(function () use ($request, $validated) {
                // اگر این آدرس پیش‌فرض است، بقیه را از حالت پیش‌فرض خارج کن
                if (!empty($validated['is_default'])) {
                    Address::where('user_id', $request->user()->id)
                        ->update(['is_default' => false]);
                }

                // اگر اولین آدرس کاربر است، به صورت خودکار پیش‌فرض شود
                $isFirstAddress = Address::where('user_id', $request->user()->id)->count() === 0;

                $address = Address::create([
                    'user_id' => $request->user()->id,
                    'title' => $validated['title'],
                    'full_name' => $validated['full_name'],
                    'phone' => $validated['phone'],
                    'province' => $validated['province'],
                    'city' => $validated['city'],
                    'address' => $validated['address'],
                    'postal_code' => $validated['postal_code'] ?? null,
                    'is_default' => $isFirstAddress || !empty($validated['is_default']),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'آدرس با موفقیت اضافه شد',
                    'data' => $address,
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('AddressController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در افزودن آدرس',
            ], 500);
        }
    }

    /**
     * ویرایش آدرس
     */
    public function update(Request $request, $addressId)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:100',
            'full_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'province' => 'sometimes|string|max:100',
            'city' => 'sometimes|string|max:100',
            'address' => 'sometimes|string',
            'postal_code' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        try {
            $address = Address::where('id', $addressId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            return DB::transaction(function () use ($request, $address, $validated) {
                // اگر پیش‌فرض تنظیم شده، بقیه را از حالت پیش‌فرض خارج کن
                if (isset($validated['is_default']) && $validated['is_default']) {
                    Address::where('user_id', $request->user()->id)
                        ->where('id', '!=', $address->id)
                        ->update(['is_default' => false]);
                }

                $address->update($validated);

                return response()->json([
                    'success' => true,
                    'message' => 'آدرس به‌روزرسانی شد',
                    'data' => $address,
                ]);
            });
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'آدرس یافت نشد',
            ], 404);
        } catch (\Exception $e) {
            Log::error('AddressController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در ویرایش آدرس',
            ], 500);
        }
    }

    /**
     * حذف آدرس
     */
    public function destroy(Request $request, $addressId)
    {
        try {
            $address = Address::where('id', $addressId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $wasDefault = $address->is_default;
            $address->delete();

            // اگر آدرس حذف شده پیش‌فرض بود، اولین آدرس باقی‌مانده را پیش‌فرض کن
            if ($wasDefault) {
                $newDefault = Address::where('user_id', $request->user()->id)
                    ->orderByDesc('created_at')
                    ->first();
                
                if ($newDefault) {
                    $newDefault->is_default = true;
                    $newDefault->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'آدرس حذف شد',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'آدرس یافت نشد',
            ], 404);
        } catch (\Exception $e) {
            Log::error('AddressController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در حذف آدرس',
            ], 500);
        }
    }

    /**
     * تنظیم آدرس به عنوان پیش‌فرض
     */
    public function setDefault(Request $request, $addressId)
    {
        try {
            $address = Address::where('id', $addressId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $address->setAsDefault();

            return response()->json([
                'success' => true,
                'message' => 'آدرس پیش‌فرض تنظیم شد',
                'data' => $address,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'آدرس یافت نشد',
            ], 404);
        } catch (\Exception $e) {
            Log::error('AddressController@setDefault: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'خطا در تنظیم آدرس پیش‌فرض',
            ], 500);
        }
    }
}