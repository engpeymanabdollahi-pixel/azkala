<?php

namespace App\Services;

use App\Models\Category;
use App\Models\DeviceModel;

/**
 * ✅ Device-First Architecture فاز ۱L: لایه‌ی اعتبارسنجی مشترک برای
 * «آیا این مدل(های) دستگاه واقعاً قابل‌انتخاب‌اند؟» — استفاده‌شده در فرم
 * تکی فروشنده (SellerProductController) و آپلود گروهی (BulkProductService)
 * تا هر دو مسیر دقیقاً یک قانون را اجرا کنند، نه دو نسخه‌ی احتمالاً
 * ناهم‌خوان.
 *
 * دو قانون:
 *   ۱. زنجیره‌ی مدل→سری→برند→خانواده باید کاملاً فعال باشد (خانواده‌ی
 *      نامشخص/family_id=null هم‌چنان پذیرفته می‌شود — سازگاری با برندهایی
 *      که هنوز به هیچ خانواده‌ای وصل نشده‌اند).
 *   ۲. اگر دسته‌بندی حداقل یک خانواده‌ی دستگاه به آن متصل شده باشد
 *      (یعنی صریحاً وارد سیستم Device-First شده)، هر مدل انتخابی باید به
 *      یکی از همان خانواده‌ها تعلق داشته باشد. دسته‌بندی‌ای که هنوز هیچ
 *      خانواده‌ای برایش تنظیم نشده (وضعیت فعلی همه‌ی دسته‌های دیتابیس —
 *      طبق فاز ۰ نام‌های بی‌معنی Faker دارند و عمداً بدون خانواده رها
 *      شدند) از این قانون معاف است؛ در غیر این صورت، تا وقتی ادمین همه‌ی
 *      دسته‌ها را پیکربندی نکند، کل قابلیت سازگاری دستگاه برای فروشنده‌ها
 *      قفل می‌شد — یک رگرسیون فوری و بی‌فایده، نه یک قانون امنیتی واقعی.
 */
class DeviceEnforcementService
{
    /**
     * @throws \InvalidArgumentException
     */
    public function assertModelsSelectable(array $modelIds, ?int $categoryId = null): void
    {
        $modelIds = array_values(array_unique(array_filter($modelIds, fn ($id) => $id !== null)));

        if (empty($modelIds)) {
            return;
        }

        $models = DeviceModel::query()
            ->whereIn('id', $modelIds)
            ->where('is_active', true)
            ->whereHas('series', function ($q) {
                $q->where('is_active', true)->whereHas('brand', function ($qb) {
                    $qb->where('is_active', true)
                        ->where(function ($qf) {
                            $qf->whereNull('family_id')->orWhereHas('family', fn ($f) => $f->where('is_active', true));
                        });
                });
            })
            ->with('series.brand')
            ->get();

        if ($models->count() !== count($modelIds)) {
            throw new \InvalidArgumentException(
                'یک یا چند مدل دستگاه انتخابی یافت نشد یا متعلق به سری/برند/خانواده‌ی غیرفعال است.'
            );
        }

        if (! $categoryId) {
            return;
        }

        $category = Category::find($categoryId);
        if (! $category) {
            return;
        }

        $categoryFamilyIds = $category->deviceFamilies()->pluck('device_families.id');
        if ($categoryFamilyIds->isEmpty()) {
            // این دسته هنوز به هیچ خانواده‌ای وصل نشده — طبق تصمیم مستندشده
            // بالا، از قانون تطبیق معاف است.
            return;
        }

        foreach ($models as $model) {
            $familyId = $model->series?->brand?->family_id;
            if ($familyId && ! $categoryFamilyIds->contains($familyId)) {
                throw new \InvalidArgumentException(
                    "دسته‌بندی انتخابی با اکوسیستم دستگاهِ مدل '{$model->name}' سازگار نیست."
                );
            }
        }
    }
}
