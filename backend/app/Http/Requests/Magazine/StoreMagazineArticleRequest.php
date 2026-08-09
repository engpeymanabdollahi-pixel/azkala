<?php

namespace App\Http\Requests\Magazine;

use App\Models\MagazineArticle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

/**
 * Validation برای ایجاد مقاله جدید در مجله ازکالا
 * 
 * استفاده: AdminMagazineController::store
 * 
 * الگو از: CreateAlertRequest
 */
class StoreMagazineArticleRequest extends FormRequest
{
    /**
     * فقط ادمین‌ها می‌توانند مقاله ایجاد کنند
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    /**
     * قوانین validation
     */
    public function rules(): array
    {
        return [
            // اطلاعات اصلی مقاله
            'title' => ['required', 'string', 'max:500'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('magazine_articles', 'slug'),
            ],
            'excerpt' => ['nullable', 'string', 'max:2000'],
            'content' => [
                'required_if:content_source,admin',
                'nullable',
                'string',
            ],
            
            // تصویر شاخص
            'featured_image' => ['nullable', 'string', 'max:500'],
            
            // منبع خارجی
            'source_url' => ['nullable', 'url', 'max:1000'],
            'source_name' => ['nullable', 'string', 'max:100'],
            
            // دسته‌بندی
            'category' => ['required', Rule::in([
                MagazineArticle::CATEGORY_NEWS,
                MagazineArticle::CATEGORY_REVIEW,
                MagazineArticle::CATEGORY_COMPARISON,
                MagazineArticle::CATEGORY_GUIDE,
                MagazineArticle::CATEGORY_RUMOR,
            ])],
            
            // زبان (پیش‌فرض فارسی - در prepareForValidation تنظیم می‌شود)
            'language' => ['nullable', 'string', 'max:5'],
            
            // زمان‌بندی انتشار
            'published_at' => ['nullable', 'date'],
            'is_published' => ['nullable', 'boolean'],
            
            // نوع محتوا (admin, rss, ai_generated)
            'content_source' => ['nullable', Rule::in([
                MagazineArticle::SOURCE_ADMIN,
                MagazineArticle::SOURCE_RSS,
                MagazineArticle::SOURCE_AI,
            ])],
            
            // فیلدهای AI (برای آینده)
            'is_ai_rewritten' => ['nullable', 'boolean'],
            'ai_rewrite_prompt' => ['nullable', 'string', 'max:1000'],
            
            // دستگاه‌های مرتبط
            // ساختار: [{device_id: 1, relevance_score: 100}, ...]
            'devices' => ['nullable', 'array', 'max:50'],
            'devices.*.device_id' => [
                'required_with:devices',
                'integer',
                'exists:device_models,id',
            ],
            'devices.*.relevance_score' => [
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
        ];
    }

    /**
     * پیام‌های فارسی
     */
    public function messages(): array
    {
        return [
            'title.required' => 'عنوان مقاله الزامی است',
            'title.max' => 'عنوان نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد',
            
            'slug.unique' => 'این slug قبلاً استفاده شده است',
            'slug.max' => 'slug نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد',
            
            'excerpt.max' => 'خلاصه نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد',
            
            'content.required_if' => 'برای مقالات دستی، محتوا الزامی است',
            
            'source_url.url' => 'لینک منبع نامعتبر است',
            'source_url.max' => 'لینک منبع بسیار طولانی است',
            
            'category.required' => 'دسته‌بندی الزامی است',
            'category.in' => 'دسته‌بندی نامعتبر است',
            
            'published_at.date' => 'تاریخ انتشار نامعتبر است',
            
            'content_source.in' => 'نوع منبع محتوا نامعتبر است',
            
            'devices.max' => 'حداکثر ۵۰ دستگاه می‌تواند مرتبط باشد',
            'devices.*.device_id.exists' => 'دستگاه انتخابی یافت نشد',
            'devices.*.relevance_score.min' => 'امتیاز ارتباط نباید منفی باشد',
            'devices.*.relevance_score.max' => 'امتیاز ارتباط نمی‌تواند بیشتر از ۱۰۰ باشد',
        ];
    }

    /**
     * آماده‌سازی داده‌ها قبل از validation
     */
    protected function prepareForValidation(): void
    {
        // تولید slug از عنوان اگر ارسال نشده
        if (!$this->has('slug') || empty($this->input('slug'))) {
            $this->merge([
                'slug' => MagazineArticle::generateSlug($this->input('title', '')),
            ]);
        }
        
        // پیش‌فرض‌ها
        if (!$this->has('content_source')) {
            $this->merge(['content_source' => MagazineArticle::SOURCE_ADMIN]);
        }
        
        if (!$this->has('is_published')) {
            $this->merge(['is_published' => true]);
        }
        
        if (!$this->has('language')) {
            $this->merge(['language' => 'fa']);
        }
        
        if (!$this->has('published_at')) {
            $this->merge(['published_at' => now()->toDateTimeString()]);
        }
    }
}