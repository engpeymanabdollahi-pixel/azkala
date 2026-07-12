<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer', 'exists:addresses,id'],
            'payment_method' => ['required', 'string', 'in:online,cash_on_delivery,wallet'],
            'coupon_code' => ['nullable', 'string', 'exists:coupons,code'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'address_id.required' => 'انتخاب آدرس الزامی است',
            'address_id.exists' => 'آدرس انتخاب شده معتبر نیست',
            'payment_method.required' => 'انتخاب روش پرداخت الزامی است',
            'payment_method.in' => 'روش پرداخت نامعتبر است',
            'coupon_code.exists' => 'کد تخفیف نامعتبر است',
            'notes.max' => 'یادداشت نباید بیشتر از ۵۰۰ کاراکتر باشد',
        ];
    }
}