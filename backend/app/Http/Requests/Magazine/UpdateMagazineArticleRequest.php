<?php

namespace App\Http\Requests\Magazine;

use App\Models\MagazineArticle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation برای ویرایش مقاله موجود
 * 
 * استفاده: AdminMagazineController::update
 * 
 * تفاوت با Store: slug می‌تواند همان slug فعلی باشد
 */
class UpdateMagazineArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $articleId = $this->route('article')?->id;
        
        return [
            'title' => ['sometimes', 'required', 'string', 'max:500'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('magazine_articles', 'slug')->ignore($articleId),
            ],
            'excerpt' => ['nullable', 'string', 'max:2000'],
            'content' => ['nullable', 'string'],
            
            'featured_image' => ['nullable', 'string', 'max:500'],
            
            'source_url' => ['nullable', 'url', 'max:1000'],
            'source_name' => ['nullable', 'string', 'max:100'],
            
            'category' => ['sometimes', 'required', Rule::in([
                MagazineArticle::CATEGORY_NEWS,
                MagazineArticle::CATEGORY_REVIEW,
                MagazineArticle::CATEGORY_COMPARISON,
                MagazineArticle::CATEGORY_GUIDE,
                MagazineArticle::CATEGORY_RUMOR,
            ])],
            
            'language' => ['nullable', 'string', 'max:5'],
            
            'published_at' => ['nullable', 'date'],
            'is_published' => ['nullable', 'boolean'],
            
            'content_source' => ['nullable', Rule::in([
                MagazineArticle::SOURCE_ADMIN,
                MagazineArticle::SOURCE_RSS,
                MagazineArticle::SOURCE_AI,
            ])],
            
            'is_ai_rewritten' => ['nullable', 'boolean'],
            'ai_rewrite_prompt' => ['nullable', 'string', 'max:1000'],
            
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

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان مقاله الزامی است',
            'title.max' => 'عنوان نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد',
            
            'slug.unique' => 'این slug قبلاً استفاده شده است',
            
            'excerpt.max' => 'خلاصه نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد',
            
            'source_url.url' => 'لینک منبع نامعتبر است',
            
            'category.required' => 'دسته‌بندی الزامی است',
            'category.in' => 'دسته‌بندی نامعتبر است',
            
            'devices.max' => 'حداکثر ۵۰ دستگاه می‌تواند مرتبط باشد',
            'devices.*.device_id.exists' => 'دستگاه انتخابی یافت نشد',
            'devices.*.relevance_score.max' => 'امتیاز ارتباط نمی‌تواند بیشتر از ۱۰۰ باشد',
        ];
    }

    protected function prepareForValidation(): void
    {
        // اگر عنوان تغییر کرد و slug ارسال نشد، slug جدید تولید کن
        if ($this->has('title') && !$this->has('slug')) {
            $this->merge([
                'slug' => MagazineArticle::generateSlug($this->input('title', '')),
            ]);
        }
    }
}