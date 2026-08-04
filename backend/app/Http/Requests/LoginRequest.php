<?php

namespace App\Http\Requests;

use App\Support\Digits;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class LoginRequest extends FormRequest
{
    /**
     * شماره پیش از اعتبارسنجی یکسان‌سازی می‌شود.
     *
     * regex زیر با [0-9] نوشته شده، پس «۰۹۱۲۳۴۵۶۷۸۹» با ارقام فارسی — که کاربر
     * ایرانی طبیعتاً تایپ می‌کند — رد می‌شد و پیام «فرمت شماره صحیح نیست»
     * می‌گرفت، در حالی که شماره درست بود.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $this->merge([
                'phone' => Str::replace([' ', '-', '+', '(', ')'], '', Digits::toLatin($this->input('phone'))),
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
        public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^09[0-9]{9}$/'], // اعتبارسنجی فرمت شماره موبایل ایران
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'شماره موبایل الزامی است',
            'phone.regex' => 'فرمت شماره موبایل صحیح نیست (مثال: 09123456789)',
            'password.required' => 'رمز عبور الزامی است',
            'password.min' => 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        ];
    }
}