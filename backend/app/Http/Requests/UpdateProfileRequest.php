<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'نام نباید بیشتر از ۲۵۵ کاراکتر باشد',
            'email.email' => 'فرمت ایمیل نامعتبر است',
            'email.unique' => 'این ایمیل قبلاً ثبت شده است',
            'phone.max' => 'شماره تلفن نباید بیشتر از ۲۰ کاراکتر باشد',
        ];
    }
}