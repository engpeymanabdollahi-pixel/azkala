<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Brand extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'is_active',
        'country',
        'website',
        'founded_year',
        'is_featured',
        'verified_at',
        'verification_badge',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'social_media',
        'gallery',
        'primary_color',
        'secondary_color',
        'sort_order',
        'products_count',
        'models_count',
        'series_count',
        'rating',
        'reviews_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'verified_at' => 'datetime',
        'social_media' => 'array',
        'gallery' => 'array',
        'founded_year' => 'integer',
        'sort_order' => 'integer',
        'products_count' => 'integer',
        'models_count' => 'integer',
        'series_count' => 'integer',
        'rating' => 'decimal:2',
        'reviews_count' => 'integer',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function phoneModels()
    {
        return $this->hasMany(PhoneModel::class);
    }

    public function phoneSeries()
    {
        return $this->hasMany(PhoneSeries::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }

    public function isVerified(): bool
    {
        return !is_null($this->verified_at);
    }

    public function getBadgeLabel(): string
    {
        return match($this->verification_badge) {
            'gold' => 'طلایی',
            'platinum' => 'پلاتینیوم',
            'diamond' => 'الماس',
            default => 'بدون نشان',
        };
    }
}