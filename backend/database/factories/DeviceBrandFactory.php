<?php

namespace Database\Factories;

use App\Models\DeviceBrand;
use App\Models\DeviceFamily;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DeviceBrandFactory extends Factory
{
    protected $model = DeviceBrand::class;

    public function definition(): array
    {
        $name = $this->faker->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            // ✅ Device-First Architecture — حذف نهایی type: خانواده‌ی
            // canonical تصادفی (Smartphone/Laptop/Tablet که خودِ migration
            // ها می‌سازند) به‌عنوان پیش‌فرضِ family-first. تست‌هایی که به‌طور
            // خاص برند بدون family نیاز دارند می‌توانند صریحاً
            // ['family_id' => null] پاس بدهند.
            'family_id' => DeviceFamily::inRandomOrder()->value('id'),
            'is_active' => true,
        ];
    }
}
