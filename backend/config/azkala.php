<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Azkala Default Settings
    |--------------------------------------------------------------------------
    |
    | تنظیمات پیش‌فرض که از طریق AdminSettingService::seedDefaults() در دیتابیس
    | seed می‌شوند. اگر تنظیم قبلاً وجود داشته باشد، تغییر نمی‌کند (firstOrCreate).
    |
    */

    'settings_defaults' => [

        // ============ General ============
        ['key' => 'site_name', 'value' => 'ازکالا', 'group' => 'general', 'type' => 'text', 'label' => 'نام سایت', 'is_sensitive' => false],
        ['key' => 'site_description', 'value' => 'مرجع خرید لوازم جانبی موبایل', 'group' => 'general', 'type' => 'text', 'label' => 'توضیحات سایت', 'is_sensitive' => false],
        ['key' => 'site_logo', 'value' => '', 'group' => 'general', 'type' => 'image', 'label' => 'لوگوی سایت', 'is_sensitive' => false],
        ['key' => 'site_favicon', 'value' => '', 'group' => 'general', 'type' => 'image', 'label' => 'فاویکون', 'is_sensitive' => false],
        ['key' => 'support_phone', 'value' => '021-12345678', 'group' => 'general', 'type' => 'text', 'label' => 'تلفن پشتیبانی', 'is_sensitive' => false],
        ['key' => 'support_email', 'value' => 'support@azkala.com', 'group' => 'general', 'type' => 'text', 'label' => 'ایمیل پشتیبانی', 'is_sensitive' => false],
        ['key' => 'address', 'value' => '', 'group' => 'general', 'type' => 'text', 'label' => 'آدرس', 'is_sensitive' => false],
        ['key' => 'working_hours', 'value' => 'شنبه تا پنجشنبه ۱۰ تا ۱۸', 'group' => 'general', 'type' => 'text', 'label' => 'ساعات کاری', 'is_sensitive' => false],
        ['key' => 'primary_color', 'value' => '#14b8a6', 'group' => 'general', 'type' => 'color', 'label' => 'رنگ اصلی', 'is_sensitive' => false],
        ['key' => 'accent_color', 'value' => '#f97316', 'group' => 'general', 'type' => 'color', 'label' => 'رنگ تأکیدی', 'is_sensitive' => false],

        // ============ Social ============
        ['key' => 'instagram_url', 'value' => '', 'group' => 'general', 'type' => 'text', 'label' => 'لینک اینستاگرام', 'is_sensitive' => false],
        ['key' => 'telegram_url', 'value' => '', 'group' => 'general', 'type' => 'text', 'label' => 'لینک تلگرام', 'is_sensitive' => false],
        ['key' => 'twitter_url', 'value' => '', 'group' => 'general', 'type' => 'text', 'label' => 'لینک توییتر', 'is_sensitive' => false],
        ['key' => 'about_text', 'value' => '', 'group' => 'general', 'type' => 'text', 'label' => 'متن درباره ما', 'is_sensitive' => false],

        // ============ Legal ============
        ['key' => 'enamad_code', 'value' => '', 'group' => 'legal', 'type' => 'text', 'label' => 'کد اینماد', 'is_sensitive' => false],
        ['key' => 'samandehi_code', 'value' => '', 'group' => 'legal', 'type' => 'text', 'label' => 'کد ساماندهی', 'is_sensitive' => false],
        ['key' => 'terms_text', 'value' => '', 'group' => 'legal', 'type' => 'text', 'label' => 'متن قوانین', 'is_sensitive' => false],
        ['key' => 'privacy_text', 'value' => '', 'group' => 'legal', 'type' => 'text', 'label' => 'متن حریم خصوصی', 'is_sensitive' => false],

        // ============ 🎯 Marketing - Announcement Bar ============
        [
            'key' => 'announcement_enabled',
            'value' => '1',
            'group' => 'marketing',
            'type' => 'boolean',
            'label' => 'فعال‌سازی نوار اطلاع‌رسانی',
            'is_sensitive' => false,
        ],
        [
            'key' => 'announcement_text',
            'value' => 'ارسال رایگان بالای ۵۰۰ هزار تومان | ضمانت اصالت و سلامت کالا | پشتیبانی ۷ روز هفته',
            'group' => 'marketing',
            'type' => 'text',
            'label' => 'متن نوار اطلاع‌رسانی',
            'is_sensitive' => false,
        ],
        [
            'key' => 'announcement_link',
            'value' => '',
            'group' => 'marketing',
            'type' => 'text',
            'label' => 'لینک نوار (اختیاری)',
            'is_sensitive' => false,
        ],
        [
            'key' => 'announcement_bg_color',
            'value' => 'gradient',
            'group' => 'marketing',
            'type' => 'text',
            'label' => 'رنگ پس‌زمینه (gradient | primary | dark | success)',
            'is_sensitive' => false,
        ],
        [
            'key' => 'announcement_show_live_users',
            'value' => '1',
            'group' => 'marketing',
            'type' => 'boolean',
            'label' => 'نمایش تعداد کاربران آنلاین',
            'is_sensitive' => false,
        ],

        // ============ Seller Request (از قبل) ============
        [
            'key' => 'seller_request_bg_image',
            'value' => '/images/iran-aerial.jpg',
            'group' => 'general',
            'type' => 'image',
            'label' => 'تصویر پس‌زمینه درخواست فروشندگی',
            'is_sensitive' => false,
        ],
    ],
];