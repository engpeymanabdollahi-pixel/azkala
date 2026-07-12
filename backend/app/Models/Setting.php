<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Setting extends Model
{
    use HasFactory;
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'label',
        'description',
        'is_locked',
        'is_sensitive',
        'updated_by',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'is_sensitive' => 'boolean',
    ];

    // ==================== Relationships ====================

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ==================== Static Helpers ====================

    /**
     * ط¯ط±غŒط§ظپطھ ظ…ظ‚ط¯ط§ط± غŒع© طھظ†ط¸غŒظ…
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) return $default;

        return self::castValue($setting->value, $setting->type, $default);
    }

    /**
     * طھظ†ط¸غŒظ… ظ…ظ‚ط¯ط§ط± غŒع© طھظ†ط¸غŒظ…
     */
    public static function set(string $key, $value, array $meta = []): self
    {
        $setting = self::firstOrCreate(
            ['key' => $key],
            [
                'group' => $meta['group'] ?? 'general',
                'type' => $meta['type'] ?? 'text',
                'label' => $meta['label'] ?? $key,
                'description' => $meta['description'] ?? null,
                'is_locked' => $meta['is_locked'] ?? false,
                'is_sensitive' => $meta['is_sensitive'] ?? false,
            ]
        );

        // ط°ط®غŒط±ظ‡ طھط§ط±غŒط®ع†ظ‡
        if ($setting->value !== null && $setting->value !== json_encode($value)) {
            SettingHistory::create([
                'setting_key' => $key,
                'group' => $setting->group,
                'old_value' => $setting->value,
                'new_value' => is_array($value) || is_object($value) ? json_encode($value) : $value,
                'changed_by' => auth()->id(),
                'label' => $setting->label,
            ]);
        }

        // ط°ط®غŒط±ظ‡ ظ…ظ‚ط¯ط§ط± ط¬ط¯غŒط¯
        $setting->value = is_array($value) || is_object($value) ? json_encode($value) : $value;
        $setting->updated_by = auth()->id();
        $setting->save();

        return $setting;
    }

    /**
     * ط¯ط±غŒط§ظپطھ ظ‡ظ…ظ‡ طھظ†ط¸غŒظ…ط§طھ غŒع© ع¯ط±ظˆظ‡
     */
    public static function getGroup(string $group): array
    {
        return self::where('group', $group)
            ->get()
            ->mapWithKeys(function ($setting) {
                return [$setting->key => self::castValue($setting->value, $setting->type)];
            })
            ->toArray();
    }

    /**
     * طھط¨ط¯غŒظ„ ظ…ظ‚ط¯ط§ط± ط¨ط± ط§ط³ط§ط³ ظ†ظˆط¹
     */
    private static function castValue($value, string $type, $default = null)
    {
        if ($value === null) return $default;

        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'number', 'integer' => (int) $value,
            'float', 'decimal' => (float) $value,
            'json', 'array' => json_decode($value, true) ?? [],
            default => $value,
        };
    }
}