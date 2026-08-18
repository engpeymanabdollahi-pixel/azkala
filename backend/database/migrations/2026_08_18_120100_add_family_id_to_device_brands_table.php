<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// ✅ Device-First Architecture — Phase 1C: device_brands.family_id.
//
// این migration هم schema و هم داده را در یک گام امن جابه‌جا می‌کند:
//   ۱. ستون family_id (nullable، FK به device_families) اضافه می‌شود.
//   ۲. سه DeviceFamily اولیه (Smartphone/Laptop/Tablet) ساخته می‌شوند
//      (firstOrCreate روی slug — idempotent، اگر از قبل با DeviceFamilySeeder
//      ساخته شده باشند دوباره نمی‌سازد).
//   ۳. هر DeviceBrand موجود بر اساس type قدیمی‌اش (mobile/laptop/tablet)
//      به family_id متناظر نگاشت می‌شود.
//   ۴. اگر مقدار type غیرمنتظره‌ای دیده شود (نه mobile/laptop/tablet)،
//      migration متوقف می‌شود و خطای صریح می‌دهد — طبق قانون صریح فاز ۱C:
//      «هرگز بی‌صدا مقداردهی نکن».
//
// ستون type عمداً حذف نمی‌شود (فاز ۱D) — این یک migration جداگانه و بعدی
// خواهد بود، بعد از اینکه همه‌ی ارجاعات کد به family_id منتقل شدند.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('device_brands', function (Blueprint $table) {
            if (! Schema::hasColumn('device_brands', 'family_id')) {
                $table->foreignId('family_id')->nullable()->after('type')
                    ->constrained('device_families')->nullOnDelete();
                $table->index('family_id');
            }
        });

        $map = [
            'mobile' => 'smartphone',
            'laptop' => 'laptop',
            'tablet' => 'tablet',
        ];

        $familyIds = [];
        foreach (array_unique($map) as $slug) {
            $names = [
                'smartphone' => 'Smartphone',
                'laptop' => 'Laptop',
                'tablet' => 'Tablet',
            ];
            $id = DB::table('device_families')->where('slug', $slug)->value('id');
            if (! $id) {
                $id = DB::table('device_families')->insertGetId([
                    'name' => $names[$slug],
                    'slug' => $slug,
                    'is_active' => true,
                    'sort_order' => array_search($slug, ['smartphone', 'laptop', 'tablet']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $familyIds[$slug] = $id;
        }

        $brands = DB::table('device_brands')->select('id', 'type')->get();
        $unexpected = [];

        foreach ($brands as $brand) {
            if ($brand->type === null) {
                // بدون type — بدون family_id می‌ماند، بعداً دستی از ادمین قابل تنظیم است.
                continue;
            }
            if (! array_key_exists($brand->type, $map)) {
                $unexpected[] = $brand->id.':'.$brand->type;
                continue;
            }
            DB::table('device_brands')->where('id', $brand->id)->update([
                'family_id' => $familyIds[$map[$brand->type]],
            ]);
        }

        if (! empty($unexpected)) {
            throw new \RuntimeException(
                'Device-First migration توقف کرد: مقدار غیرمنتظره‌ی device_brands.type دیده شد '.
                '(id:type) => '.implode(', ', $unexpected).
                ' — طبق قانون صریح فاز ۱C این‌ها نباید بی‌صدا نگاشت شوند.'
            );
        }
    }

    public function down(): void
    {
        Schema::table('device_brands', function (Blueprint $table) {
            if (Schema::hasColumn('device_brands', 'family_id')) {
                $table->dropConstrainedForeignId('family_id');
            }
        });
    }
};
