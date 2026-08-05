<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Device;
use Database\Data\DeviceCompatibilityMap;

class DevicesSeeder extends Seeder
{
    /**
     * اجرای سکدر دستگاه‌ها با الگوی Upsert
     * 
     * @return void
     */
    public function run(): void
    {
        $this->command->info('📱 در حال وارد کردن دستگاه‌ها و مدل‌های گوشی...');

        $devices = DeviceCompatibilityMap::getDevices();
        $devicesCount = 0;

        foreach ($devices as $deviceData) {
            // پیدا کردن برند مرتبط
            $brand = \App\Models\Brand::where('slug', $deviceData['brand_slug'])->first();
            
            if (!$brand) {
                $this->command->warn("⚠️ برند '{$deviceData['brand_slug']}' برای دستگاه '{$deviceData['name']}' یافت نشد. رد شد.");
                continue;
            }

            Device::updateOrCreate(
                ['slug' => $deviceData['slug']],
                [
                    'name' => $deviceData['name'],
                    'brand_id' => $brand->id,
                    'release_year' => $deviceData['release_year'],
                    'connector_type' => $deviceData['connector_type'],
                    'screen_size' => $deviceData['screen_size'],
                    'compatibility_rules' => json_encode($deviceData['compatibility_rules']),
                ]
            );
            $devicesCount++;
        }

        $this->command->info("✅ {$devicesCount} دستگاه با موفقیت وارد/آپدیت شدند.");
    }
}
