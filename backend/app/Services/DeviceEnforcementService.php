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
     * ✅ Device-First Architecture فاز ۳: کش درون‌درخواستی — این سرویس در
     * BulkProductService::createProducts() تا ۵۰۰ بار در یک درخواست (هر
     * ردیف اکسل یک‌بار) صدا زده می‌شود. اندازه‌گیری واقعی نشان داد هر
     * صدازدن ~۵ کوئری فقط برای همین متد اضافه می‌کرد (۳ برای مدل/سری/برند،
     * ۲ برای دسته‌بندی/family_ids) — درحالی‌که در عمل اکثر ردیف‌های یک فایل
     * bulk، همان یک دسته‌بندی یا همان یک مدل دستگاه را تکرار می‌کنند (مثلاً
     * ۵۰ لوازم جانبی برای یک گوشی). چون این سرویس به‌ازای هر درخواست HTTP
     * از نو resolve می‌شود (Laravel container، بدون singleton)، یک کش
     * درون‌نمونه‌ای امن است و بین درخواست‌های مختلف نشتی ندارد. رفتار و
     * پیام خطاها دقیقاً همان قبلی است.
     */
    private array $categoryFamilyIdsCache = [];

    private array $modelChainCache = [];

    /**
     * @throws \InvalidArgumentException
     */
    public function assertModelsSelectable(array $modelIds, ?int $categoryId = null): void
    {
        $modelIds = array_values(array_unique(array_filter($modelIds, fn ($id) => $id !== null)));

        if (empty($modelIds)) {
            return;
        }

        $models = $this->resolveActiveModelChains($modelIds);

        if (count($models) !== count($modelIds)) {
            throw new \InvalidArgumentException(
                'یک یا چند مدل دستگاه انتخابی یافت نشد یا متعلق به سری/برند/خانواده‌ی غیرفعال است.'
            );
        }

        if (! $categoryId) {
            return;
        }

        $categoryFamilyIds = $this->resolveCategoryFamilyIds($categoryId);
        if ($categoryFamilyIds === null || $categoryFamilyIds->isEmpty()) {
            // دسته یافت نشد یا هنوز به هیچ خانواده‌ای وصل نشده — طبق تصمیم
            // مستندشده بالا، از قانون تطبیق معاف است.
            return;
        }

        foreach ($modelIds as $modelId) {
            $familyId = $models[$modelId]['family_id'] ?? null;
            if ($familyId && ! $categoryFamilyIds->contains($familyId)) {
                throw new \InvalidArgumentException(
                    "دسته‌بندی انتخابی با اکوسیستم دستگاهِ مدل '{$models[$modelId]['name']}' سازگار نیست."
                );
            }
        }
    }

    /**
     * @param  int[]  $modelIds
     * @return array<int, array{name: string, family_id: ?int}> فقط مدل‌های
     *              معتبر (زنجیره‌ی کاملاً فعال)، کلید = model id.
     */
    private function resolveActiveModelChains(array $modelIds): array
    {
        $uncached = array_values(array_diff($modelIds, array_keys($this->modelChainCache)));

        if (! empty($uncached)) {
            $found = DeviceModel::query()
                ->whereIn('id', $uncached)
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

            foreach ($found as $model) {
                $this->modelChainCache[$model->id] = [
                    'name' => $model->name,
                    'family_id' => $model->series?->brand?->family_id,
                ];
            }
        }

        return array_intersect_key($this->modelChainCache, array_flip($modelIds));
    }

    private function resolveCategoryFamilyIds(int $categoryId): ?\Illuminate\Support\Collection
    {
        if (array_key_exists($categoryId, $this->categoryFamilyIdsCache)) {
            return $this->categoryFamilyIdsCache[$categoryId];
        }

        $category = Category::find($categoryId);
        $result = $category ? $category->deviceFamilies()->pluck('device_families.id') : null;

        return $this->categoryFamilyIdsCache[$categoryId] = $result;
    }
}
