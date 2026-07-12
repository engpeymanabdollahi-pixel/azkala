<?php

namespace App\Repositories;

use App\Models\Setting;
use App\Models\SettingHistory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminSettingRepository
{
    /**
     * Get all settings with optional filters
     */
    public function getSettings(?string $group = null, ?string $search = null): Collection
    {
        $query = Setting::query();

        if ($group) {
            $query->where('group', $group);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('key', 'LIKE', "%{$search}%")
                  ->orWhere('label', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        return $query->orderBy('group')->orderBy('id')->get();
    }

    /**
     * Find setting by key
     */
    public function findByKey(string $key): ?Setting
    {
        return Setting::where('key', $key)->first();
    }

    /**
     * Find setting by key or fail
     */
    public function findByKeyOrFail(string $key): Setting
    {
        return Setting::where('key', $key)->firstOrFail();
    }

    /**
     * Update setting value
     */
    public function updateSetting(Setting $setting, string $value, ?int $userId = null): bool
    {
        $setting->value = $value;
        $setting->updated_by = $userId;
        return $setting->save();
    }

    /**
     * Toggle setting lock
     */
    public function toggleLock(Setting $setting): bool
    {
        $setting->is_locked = !$setting->is_locked;
        return $setting->save();
    }

    /**
     * Create setting history
     */
    public function createHistory(array $data): SettingHistory
    {
        return SettingHistory::create($data);
    }

    /**
     * Get settings history with pagination
     */
    public function getHistory(?string $group = null, ?string $key = null, int $perPage = 20): LengthAwarePaginator
    {
        $query = SettingHistory::with('changer:id,name,email');

        if ($group) {
            $query->where('group', $group);
        }
        if ($key) {
            $query->where('setting_key', $key);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Find history by ID
     */
    public function findHistory(int $historyId): ?SettingHistory
    {
        return SettingHistory::find($historyId);
    }

    /**
     * Create or update setting (for seed)
     */
    public function firstOrCreate(array $attributes, array $values = []): Setting
    {
        return Setting::firstOrCreate($attributes, $values);
    }

    /**
     * Get settings statistics
     */
    public function getStats(): array
    {
        return [
            'total' => Setting::count(),
            'groups' => Setting::select('group')->distinct()->count('group'),
            'locked' => Setting::where('is_locked', true)->count(),
            'sensitive' => Setting::where('is_sensitive', true)->count(),
            'today_changes' => SettingHistory::whereDate('created_at', today())->count(),
        ];
    }

    /**
     * Update settings in bulk (for updateGroup)
     */
    public function updateBulk(array $items, ?int $userId = null, ?string $note = null): array
    {
        $updated = [];

        DB::transaction(function () use ($items, $userId, $note, &$updated) {
            foreach ($items as $item) {
                $setting = $this->findByKey($item['key']);
                
                if (!$setting || $setting->is_locked) {
                    continue;
                }

                $value = $item['value'];
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value);
                }

                if ($setting->value !== $value) {
                    $this->createHistory([
                        'setting_key' => $item['key'],
                        'group' => $setting->group,
                        'old_value' => $setting->value,
                        'new_value' => $value,
                        'changed_by' => $userId,
                        'note' => $note,
                        'label' => $setting->label,
                    ]);

                    $this->updateSetting($setting, $value, $userId);
                    $updated[] = $item['key'];
                }
            }
        });

        return $updated;
    }
}