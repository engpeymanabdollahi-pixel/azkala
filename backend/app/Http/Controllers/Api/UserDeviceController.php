<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserDeviceController extends Controller
{
    public function index(Request $request)
    {
        try {
            $devices = UserDevice::with('phoneModel.brand', 'phoneModel.series')
                ->where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->get();

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
        $request->validate([
            'phone_model_id' => 'required|exists:phone_models,id',
            'nickname' => 'nullable|string|max:255',
        ]);

        try {
            $device = UserDevice::firstOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'phone_model_id' => $request->phone_model_id,
                ],
                ['nickname' => $request->nickname]
            );

            return response()->json([
                'success' => true,
                'message' => 'دستگاه اضافه شد',
                'data' => $device->load('phoneModel.brand', 'phoneModel.series'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('UserDeviceController@store: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }

    public function destroy(Request $request, $deviceId)
    {
        try {
            $device = UserDevice::where('id', $deviceId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();
            
            $device->delete();

            return response()->json([
                'success' => true,
                'message' => 'دستگاه حذف شد',
            ]);
        } catch (\Exception $e) {
            Log::error('UserDeviceController@destroy: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطا'], 500);
        }
    }
}