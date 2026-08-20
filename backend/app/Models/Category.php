<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'icon',
        'image',
        'description',
        'sort_order',
        'is_active',
        // SEO
        'meta_title',
        'meta_description',
        'meta_keywords',
        // Tags & Campaign
        'tags',
        'is_temporary',
        'campaign_name',
        'start_date',
        'end_date',
        // Visual
        'bg_color',
        'text_color',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_temporary' => 'boolean',
        'tags' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'sort_order' => 'integer',
    ];

    // ==================== Relationships ====================

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    // ✅ Device-First Architecture فاز ۱I: چندبه‌چند با DeviceFamily —
    // مثلاً «شارژر و کابل» هم‌زمان به Smartphone/Laptop/Tablet وصل است.
    public function deviceFamilies(): BelongsToMany
    {
        return $this->belongsToMany(
            DeviceFamily::class,
            'category_device_family',
            'category_id',
            'device_family_id'
        );
    }

    // ==================== Scopes ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ✅ Marketplace Unification فاز B: دسته‌بندی‌هایی که به هیچ خانواده‌ای
    // وصل نیستند «سراسری»‌اند (طبق همان قرارداد DeviceEnforcementService —
    // معاف از قانون تطبیق، نه یک باگ) — یعنی همیشه باید صرف‌نظر از
    // $familyId انتخاب‌شده کنار دسته‌های آن خانواده نمایش داده شوند.
    public function scopeForFamily($query, int $familyId)
    {
        return $query->where(function ($q) use ($familyId) {
            $q->whereDoesntHave('deviceFamilies')
                ->orWhereHas('deviceFamilies', fn ($f) => $f->where('device_families.id', $familyId));
        });
    }

    public function isGlobal(): bool
    {
        return $this->relationLoaded('deviceFamilies')
            ? $this->deviceFamilies->isEmpty()
            : $this->deviceFamilies()->doesntExist();
    }

    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeTemporary($query)
    {
        return $query->where('is_temporary', true);
    }

    public function scopePermanent($query)
    {
        return $query->where('is_temporary', false);
    }

    // ==================== Methods ====================

    public function isExpired(): bool
    {
        if (! $this->is_temporary || ! $this->end_date) {
            return false;
        }

        return now()->greaterThan($this->end_date);
    }

    public function isCampaignActive(): bool
    {
        if (! $this->is_temporary) {
            return false;
        }
        $now = now();
        if ($this->start_date && $now->lessThan($this->start_date)) {
            return false;
        }
        if ($this->end_date && $now->greaterThan($this->end_date)) {
            return false;
        }

        return true;
    }
}
