<?php

namespace App\Http\Requests\Alerts;

use App\Models\ProductAlert;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAlertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

   public function rules(): array
{
    return [
        'product_id' => ['required', 'integer', 'exists:products,id'],
        'type' => ['required', Rule::in([
            ProductAlert::TYPE_RESTOCK,
            ProductAlert::TYPE_PRICE_DROP,
            ProductAlert::TYPE_TARGET_PRICE,
        ])],
        'target_price' => [
            'required_if:type,' . ProductAlert::TYPE_TARGET_PRICE,
            'nullable',
            'numeric',
            'min:1',
            'max:999999999',
        ],
        'discount_percentage' => [
            'required_if:type,' . ProductAlert::TYPE_PRICE_DROP,
            'nullable',
            'numeric',
            'min:1',
            'max:99',
        ],
        'channels' => ['sometimes', 'array'],
        'channels.*' => [Rule::in(['database', 'email'])],
    ];
}

   public function messages(): array
{
    return [
        'product_id.required' => 'محصول الزامی است',
        'product_id.exists' => 'محصول یافت نشد',
        'type.required' => 'نوع هشدار الزامی است',
        'type.in' => 'نوع هشدار نامعتبر است',
        'target_price.required_if' => 'قیمت دلخواه الزامی است',
        'target_price.numeric' => 'قیمت باید عدد باشد',
        'target_price.min' => 'قیمت باید بیشتر از صفر باشد',
        'discount_percentage.required_if' => 'درصد تخفیف الزامی است',
        'discount_percentage.numeric' => 'درصد تخفیف باید عدد باشد',
        'discount_percentage.min' => 'درصد تخفیف باید حداقل ۱٪ باشد',
        'discount_percentage.max' => 'درصد تخفیف نمی‌تواند بیشتر از ۹۹٪ باشد',
    ];
}

    protected function prepareForValidation(): void
    {
        if (!$this->has('channels')) {
            $this->merge(['channels' => ProductAlert::DEFAULT_CHANNELS]);
        }
    }
}