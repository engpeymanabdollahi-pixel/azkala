<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserDeviceService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserDeviceController extends Controller
{
    protected UserDeviceService $userDeviceService;

    public function __construct(UserDeviceService $userDeviceService)
    {
        $this->userDeviceService = $userDeviceService;
    }

    public function index(Request $request)
    {
        try {
            $devices = $this->userDeviceService->getUserDevices($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $devices,
            ]);
        } catch (\Exception $e) {
            Log::error('UserDeviceController@index: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function store(Request $request)
    {
        // ✅ ستون واقعاً به device_models اشاره می‌کند (نه phone_models
        // خالی) — رجوع کنید به مهاجرت repoint_user_devices_to_device_models.
        $request->validate([
            'phone_model_id' => 'required|exists:device_models,id',
            'nickname' => 'nullable|string|max:255',
        ]);

        try {
            $device = $this->userDeviceService->addDevice(
                $request->user()->id,
                (int) $request->phone_model_id,
                $request->nickname
            );

            return response()->json([
                'success' => true,
                'message' => 'دستگاه اضافه شد',
                'data' => $device,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // بگذار لاراول خودش پاسخ ۴۲۲ استاندارد را برگرداند
        } catch (\Exception $e) {
            Log::error('UserDeviceController@store: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function destroy(Request $request, $deviceId)
    {
        try {
            $this->userDeviceService->deleteDevice((int) $deviceId, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'دستگاه حذف شد',
            ]);
        } catch (ModelNotFoundException $e) {
            // deleteDevice() با where('user_id', ...) محدود شده، پس دستگاهِ کاربر
            // دیگر هم به همین‌جا می‌رسد و همان پاسخ «یافت نشد» را می‌گیرد.
            return response()->json([
                'success' => false,
                'message' => 'دستگاه مورد نظر یافت نشد.',
            ], 404);
        } catch (\Exception $e) {
            Log::error('UserDeviceController@destroy: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }
}