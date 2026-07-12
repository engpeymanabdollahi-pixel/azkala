<?php

namespace App\Services\Admin;

use App\Models\Setting;
use App\Repositories\AdminSettingRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

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
        } catch (\Exception $e) {
            Log::error('AdminSettingService@getGroupedSettings: ' . $e->getMessage());
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
            Cache::forget('settings_' . $group);
            Cache::forget('settings_all');

            return $updated;
        } catch (\Exception $e) {
            Log::error('AdminSettingService@updateGroup: ' . $e->getMessage());
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

                Cache::forget('settings_' . $setting->group);
                Cache::forget('settings_all');
            }

            return true;
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            throw new \Exception('تنظیم یافت نشد', 404);
        } catch (\Exception $e) {
            Log::error('AdminSettingService@updateSetting: ' . $e->getMessage());
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
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            throw new \Exception('تنظیم یافت نشد', 404);
        } catch (\Exception $e) {
            Log::error('AdminSettingService@toggleLock: ' . $e->getMessage());
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
            Log::error('AdminSettingService@getHistory: ' . $e->getMessage());
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

            if (!$history) {
                throw new \Exception('تاریخچه یافت نشد', 404);
            }

            $setting = $this->repository->findByKey($history->setting_key);

            if (!$setting) {
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
                'note' => 'بازگشت به نسخه تاریخ #' . $historyId,
                'label' => $history->label,
            ]);

            // Restore old value
            $this->repository->updateSetting($setting, $history->old_value, $userId);

            Cache::forget('settings_' . $setting->group);
            Cache::forget('settings_all');

            return true;
        } catch (\Exception $e) {
            Log::error('AdminSettingService@rollback: ' . $e->getMessage());
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
            Log::error('AdminSettingService@seedDefaults: ' . $e->getMessage());
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
            Log::error('AdminSettingService@export: ' . $e->getMessage());
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
                
                if (!$setting || $setting->is_locked) {
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
            Log::error('AdminSettingService@import: ' . $e->getMessage());
            throw new \Exception('خطا در ورود', 500);
        }
    }

    /**
     * Test SMTP (mock)
     */
    public function testSmtp(): array
    {
        // TODO: Implement real SMTP test
        return [
            'success' => true,
            'message' => 'ایمیل تست با موفقیت ارسال شد (شبیه‌سازی)',
        ];
    }

    /**
     * Test SMS (mock)
     */
    public function testSms(): array
    {
        // TODO: Implement real SMS test
        return [
            'success' => true,
            'message' => 'پیامک تست با موفقیت ارسال شد (شبیه‌سازی)',
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