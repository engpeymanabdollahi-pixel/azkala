<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\Brand;
use Illuminate\Database\Seeder;
use Database\Seeders\Data\DeviceCompatibilityMap;

class DevicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('📱 Seeding Devices...');
        
        $devices = DeviceCompatibilityMap::getDevices();
        $createdCount = 0;
        
        foreach ($devices as $deviceData) {
            // Find brand by slug
            $brand = Brand::where('slug', $deviceData['brand'])->first();
            
            if (!$brand) {
                $this->command->warn("  ⚠️ Brand '{$deviceData['brand']}' not found for device '{$deviceData['name']}'");
                continue;
            }
            
            Device::updateOrCreate(
                ['slug' => $deviceData['slug']],
                [
                    'name' => $deviceData['name'],
                    'brand_id' => $brand->id,
                    'connector_type' => $deviceData['connector_type'],
                    'release_year' => $deviceData['release_year'],
                ]
            );
            
            $createdCount++;
        }
        
        $this->command->info('  ✓ Devices seeded: ' . $createdCount);
    }
}
