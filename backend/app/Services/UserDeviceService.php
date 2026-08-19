<?php

namespace App\Services;

use App\Models\UserDevice;
use Illuminate\Database\Eloquent\Collection;

class UserDeviceService
{
    public function getUserDevices(int $userId): Collection
    {
        // ✅ Device-First Architecture فاز ۵: family هم eager-load می‌شود
        // (علاوه بر brand، نه به‌جایش) تا فرانت‌اند بتواند آیکون خانواده را
        // resolve کند؛ چیزی از شکل قبلی پاسخ حذف/تغییر نکرد — فقط یک
        // فیلد تودرتوی جدید و اختیاری (brand.family) به آن اضافه شد.
        $devices = UserDevice::with('phoneModel.series.brand.family')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return $devices->each(fn (UserDevice $device) => $this->flattenBrand($device));
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

        $device->load('phoneModel.series.brand.family');

        return $this->flattenBrand($device);
    }

    public function deleteDevice(int $deviceId, int $userId): void
    {
        $device = UserDevice::where('id', $deviceId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $device->delete();
    }
        /**
     * ✅ به‌روزرسانی نام دلخواه دستگاه
     */
    public function updateDevice(int $deviceId, int $userId, ?string $nickname): UserDevice
    {
        $device = UserDevice::where('id', $deviceId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $device->update(['nickname' => $nickname]);

        return $device->load('phoneModel.brand', 'phoneModel.series');
    }

    /**
     * ✅ DeviceModel برخلاف PhoneModel قدیمی، brand را مستقیم ندارد — فقط
     * از طریق series به آن می‌رسد (device_models -> device_series ->
     * device_brands). فرانت‌اند همیشه انتظار phone_model.brand را مستقیم
     * (هم‌ردیف با series) داشته، نه تودرتوی phone_model.series.brand —
     * این متد همان شکل قدیمی و پایدار پاسخ را حفظ می‌کند.
     */
    private function flattenBrand(UserDevice $device): UserDevice
    {
        $series = $device->phoneModel?->series;
        if ($series) {
            $device->phoneModel->setRelation('brand', $series->brand);
        }

        return $device;
    }
}
