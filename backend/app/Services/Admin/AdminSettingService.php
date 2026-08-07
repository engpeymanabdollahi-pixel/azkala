<?php

namespace App\Services\Admin;

use App\Models\Setting;
use App\Repositories\AdminSettingRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminSettingService
{
    protected AdminSettingRepository $repository;

    public function __construct(AdminSettingRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get all settings grouped
     */
    public function getGroupedSettings(?string $group = null, ?string $search = null): array
    {
        try {
            // کش‌گذاری تنظیمات با کلید داینامیک
            $cacheKey = 'settings_' . ($group ?? 'all') . '_' . ($search ?? 'simple');
            
            return Cache::remember($cacheKey, 1800, function () use ($group, $search) {
                $settings = $this->repository->getSettings($group, $search);

                $grouped = $settings->groupBy('group')->map(function ($items) {
                    return $items->map(function ($s) {
                        return [
                            'id' => $s->id,
                            'key' => $s->key,
                            'value' => $this->castValue($s->value, $s->type),
                            'group' => $s->group,
                            'type' => $s->type,
                            'label' => $s->label,
                            'description' => $s->description,
                            'is_locked' => (bool) $s->is_locked,
                            'is_sensitive' => (bool) $s->is_sensitive,
                            'updated_at' => $s->updated_at ? $s->updated_at->format('Y-m-d H:i') : null,
                        ];
                    });
                });

                $stats = $this->repository->getStats();

                return [
                    'settings' => $grouped,
                    'stats' => $stats,
                ];
            });
        } catch (\Exception $e) {
            Log::error('AdminSettingService@getGroupedSettings: '.$e->getMessage());
            throw new \Exception('خطا در دریافت تنظیمات', 500);
        }
    }

    /**
     * Update settings in a group
     */
    public function updateGroup(string $group, array $settings, ?int $userId = null, ?string $note = null): array
    {
        try {
            $updated = $this->repository->updateBulk($settings, $userId, $note);

            // Clear cache
            Cache::forget('settings_'.$group);
            Cache::forget('settings_all');

            return $updated;
        } catch (\Exception $e) {
            Log::error('AdminSettingService@updateGroup: '.$e->getMessage());
            throw new \Exception('خطا در به‌روزرسانی گروه', 500);
        }
    }

    /**
     * Update single setting
     */
    public function updateSetting(string $key, $value, ?int $userId = null, ?string $note = null): bool
    {
        try {
            $setting = $this->repository->findByKeyOrFail($key);

            if ($setting->is_locked) {
                throw new \Exception('این تنظیم قفل شده است', 403);
            }

            if (is_array($value) || is_object($value)) {
                $value = json_encode($value);
            }

            if ($setting->value !== $value) {
                $this->repository->createHistory([
                    'setting_key' => $key,
                    'group' => $setting->group,
                    'old_value' => $setting->value,
                    'new_value' => $value,
                    'changed_by' => $userId,
                    'note' => $note,
                    'label' => $setting->label,
                ]);

                $this->repository->updateSetting($setting, $value, $userId);

                Cache::forget('settings_'.$setting->group);
                Cache::forget('settings_all');
            }

            return true;
        } catch (ModelNotFoundException $e) {
            throw new \Exception('تنظیم یافت نشد', 404);
        } catch (\Exception $e) {
            Log::error('AdminSettingService@updateSetting: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Toggle setting lock
     */
    public function toggleLock(string $key): bool
    {
        try {
            $setting = $this->repository->findByKeyOrFail($key);
            $this->repository->toggleLock($setting);

            return $setting->is_locked;
        } catch (ModelNotFoundException $e) {
            throw new \Exception('تنظیم یافت نشد', 404);
        } catch (\Exception $e) {
            Log::error('AdminSettingService@toggleLock: '.$e->getMessage());
            throw new \Exception('خطا در تغییر قفل', 500);
        }
    }

    /**
     * Get settings history
     */
    public function getHistory(?string $group = null, ?string $key = null, int $perPage = 20): array
    {
        try {
            $histories = $this->repository->getHistory($group, $key, $perPage);

            return [
                'histories' => $histories->map(function ($h) {
                    return [
                        'id' => $h->id,
                        'setting_key' => $h->setting_key,
                        'group' => $h->group,
                        'label' => $h->label,
                        'old_value' => $h->old_value,
                        'new_value' => $h->new_value,
                        'note' => $h->note,
                        'changed_by' => $h->changer ? [
                            'id' => $h->changer->id,
                            'name' => $h->changer->name,
                        ] : null,
                        'created_at' => $h->created_at->format('Y-m-d H:i'),
                    ];
                }),
                'pagination' => [
                    'current_page' => $histories->currentPage(),
                    'last_page' => $histories->lastPage(),
                    'total' => $histories->total(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('AdminSettingService@getHistory: '.$e->getMessage());
            throw new \Exception('خطا در دریافت تاریخچه', 500);
        }
    }

    /**
     * Rollback to previous version
     */
    public function rollback(int $historyId, ?int $userId = null): bool
    {
        try {
            $history = $this->repository->findHistory($historyId);

            if (! $history) {
                throw new \Exception('تاریخچه یافت نشد', 404);
            }

            $setting = $this->repository->findByKey($history->setting_key);

            if (! $setting) {
                throw new \Exception('تنظیم یافت نشد', 404);
            }

            if ($setting->is_locked) {
                throw new \Exception('این تنظیم قفل است و نمی‌توان آن را تغییر داد', 403);
            }

            // Create rollback history
            $this->repository->createHistory([
                'setting_key' => $history->setting_key,
                'group' => $history->group,
                'old_value' => $setting->value,
                'new_value' => $history->old_value,
                'changed_by' => $userId,
                'note' => 'بازگشت به نسخه تاریخ #'.$historyId,
                'label' => $history->label,
            ]);

            // Restore old value
            $this->repository->updateSetting($setting, $history->old_value, $userId);

            Cache::forget('settings_'.$setting->group);
            Cache::forget('settings_all');

            return true;
        } catch (\Exception $e) {
            Log::error('AdminSettingService@rollback: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Seed default settings
     */
    public function seedDefaults(): int
    {
        try {
            $defaults = config('azkala.settings_defaults');
            $created = 0;

            foreach ($defaults as $item) {
                $setting = $this->repository->firstOrCreate(
                    ['key' => $item['key']],
                    [
                        'value' => $item['value'],
                        'group' => $item['group'],
                        'type' => $item['type'],
                        'label' => $item['label'],
                        'is_sensitive' => $item['is_sensitive'] ?? false,
                    ]
                );

                if ($setting->wasRecentlyCreated) {
                    $created++;
                }
            }

            return $created;
        } catch (\Exception $e) {
            Log::error('AdminSettingService@seedDefaults: '.$e->getMessage());
            throw new \Exception('خطا در مقداردهی اولیه', 500);
        }
    }

    /**
     * Export settings to JSON
     */
    public function export(?string $group = null): array
    {
        try {
            $settings = $this->repository->getSettings($group);

            $exported = $settings->map(function ($s) {
                return [
                    'key' => $s->key,
                    'value' => $this->castValue($s->value, $s->type),
                    'group' => $s->group,
                    'type' => $s->type,
                    'label' => $s->label,
                ];
            });

            return [
                'exported_at' => now()->format('Y-m-d H:i:s'),
                'count' => $exported->count(),
                'settings' => $exported,
            ];
        } catch (\Exception $e) {
            Log::error('AdminSettingService@export: '.$e->getMessage());
            throw new \Exception('خطا در خروجی', 500);
        }
    }

    /**
     * Import settings from JSON
     */
    public function import(array $settings, ?int $userId = null): int
    {
        try {
            $imported = 0;

            foreach ($settings as $item) {
                $setting = $this->repository->findByKey($item['key']);

                if (! $setting || $setting->is_locked) {
                    continue;
                }

                $value = $item['value'];
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value);
                }

                if ($setting->value !== $value) {
                    $this->repository->createHistory([
                        'setting_key' => $item['key'],
                        'group' => $setting->group,
                        'old_value' => $setting->value,
                        'new_value' => $value,
                        'changed_by' => $userId,
                        'note' => 'Import از فایل JSON',
                        'label' => $setting->label,
                    ]);

                    $this->repository->updateSetting($setting, $value, $userId);
                    $imported++;
                }
            }

            Cache::flush();

            return $imported;
        } catch (\Exception $e) {
            Log::error('AdminSettingService@import: '.$e->getMessage());
            throw new \Exception('خطا در ورود', 500);
        }
    }

    /**
     * تست واقعی SMTP با تنظیمات ذخیره‌شده در جدول settings
     *
     * ✅ قبلاً این متد بدون توجه به مقدار واقعی تنظیمات، همیشه success=true
     * برمی‌گرداند (یک mock ثابت) — یعنی حتی با SMTP host/port/رمز کاملاً
     * غلط یا خالی، ادمین همیشه پیام «ارسال موفق» می‌دید.
     */
    public function testSmtp(): array
    {
        $host = Setting::get('smtp_host');
        $port = Setting::get('smtp_port');
        $username = Setting::get('smtp_username');
        $password = Setting::get('smtp_password');
        $encryption = Setting::get('smtp_encryption');
        $fromEmail = Setting::get('support_email') ?: config('mail.from.address');

        if (! $host || ! $port || ! $fromEmail) {
            return [
                'success' => false,
                'message' => 'برای تست، ابتدا SMTP Host، Port و ایمیل پشتیبانی را در تنظیمات ذخیره کنید',
            ];
        }

        try {
            config([
                'mail.mailers.smtp.host' => $host,
                'mail.mailers.smtp.port' => (int) $port,
                'mail.mailers.smtp.username' => $username ?: null,
                'mail.mailers.smtp.password' => $password ?: null,
                'mail.mailers.smtp.encryption' => $encryption ?: null,
                // تایم‌اوت کوتاه تا در صورت مسدود بودن شبکه، تست به‌جای هنگ کردن سریع شکست بخورد
                'mail.mailers.smtp.timeout' => 5,
            ]);

            Mail::mailer('smtp')->raw(
                'این یک ایمیل تست از پنل مدیریت ازکالا است. اگر این ایمیل را دریافت کرده‌اید، تنظیمات SMTP صحیح است.',
                function ($message) use ($fromEmail) {
                    $message->to($fromEmail)->subject('تست تنظیمات SMTP - ازکالا');
                }
            );

            return [
                'success' => true,
                'message' => 'ایمیل تست با موفقیت ارسال شد',
            ];
        } catch (\Exception $e) {
            Log::error('AdminSettingService@testSmtp: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'خطا در ارسال ایمیل تست: '.$e->getMessage(),
            ];
        }
    }

    /**
     * تست تنظیمات پیامک
     *
     * ✅ قبلاً این متد بدون توجه به مقدار واقعی تنظیمات، همیشه success=true
     * برمی‌گرداند — یعنی حتی بدون هیچ کلید API یا شماره فرستنده‌ای، ادمین
     * پیام «ارسال موفق» می‌دید. چون هیچ درگاه پیامک واقعی در این پروژه
     * پیاده‌سازی نشده، این متد اکنون حداقل صحت وجود تنظیمات لازم را واقعاً
     * بررسی می‌کند و به‌جای موفقیت جعلی، صادقانه اعلام می‌کند که اتصال به
     * درگاه واقعی هنوز پیاده‌سازی نشده است.
     */
    public function testSms(): array
    {
        $provider = Setting::get('sms_provider');
        $apiKey = Setting::get('sms_api_key');
        $senderNumber = Setting::get('sms_sender_number');

        if (! $provider || ! $apiKey || ! $senderNumber) {
            return [
                'success' => false,
                'message' => 'برای تست پیامک، ابتدا سرویس‌دهنده، کلید API و شماره فرستنده را در تنظیمات ذخیره کنید',
            ];
        }

        return [
            'success' => true,
            'message' => 'تنظیمات پیامک ذخیره شده است؛ اتصال به درگاه واقعی پیامک هنوز پیاده‌سازی نشده (شبیه‌سازی)',
        ];
    }

    /**
     * Cast value based on type
     */
    protected function castValue($value, string $type)
    {
        if ($type === 'boolean') {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        } elseif ($type === 'number') {
            return (int) $value;
        } elseif ($type === 'json') {
            return json_decode($value, true) ?? [];
        }

        return $value;
    }
}
