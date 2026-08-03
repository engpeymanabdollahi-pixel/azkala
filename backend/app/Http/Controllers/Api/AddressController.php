<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AddressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AddressController extends Controller
{
    protected AddressService $addressService;

    public function __construct(AddressService $addressService)
    {
        $this->addressService = $addressService;
    }

    /**
     * لیست آدرس‌های کاربر
     */
    public function index(Request $request)
    {
        try {
            $addresses = $this->addressService->getUserAddresses($request->user()->id);

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
            $address = $this->addressService->createAddress($request->user()->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'آدرس با موفقیت اضافه شد',
                'data' => $address,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
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
            $address = $this->addressService->updateAddress((int) $addressId, $request->user()->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'آدرس به‌روزرسانی شد',
                'data' => $address,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'آدرس یافت نشد',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
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
            $this->addressService->deleteAddress((int) $addressId, $request->user()->id);

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
            $address = $this->addressService->setDefaultAddress((int) $addressId, $request->user()->id);

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