<?php

namespace App\Services;

use App\Models\UserDevice;
use Illuminate\Database\Eloquent\Collection;

class UserDeviceService
{
    public function getUserDevices(int $userId): Collection
    {
        return UserDevice::with('phoneModel.brand', 'phoneModel.series')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function addDevice(int $userId, int $phoneModelId, ?string $nickname): UserDevice
    {
        $device = UserDevice::firstOrCreate(
            [
                'user_id' => $userId,
                'phone_model_id' => $phoneModelId,
            ],
            ['nickname' => $nickname]
        );

        return $device->load('phoneModel.brand', 'phoneModel.series');
    }

    public function deleteDevice(int $deviceId, int $userId): void
    {
        $device = UserDevice::where('id', $deviceId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $device->delete();
    }
}
