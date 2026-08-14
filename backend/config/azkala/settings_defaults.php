<?php

/**
 * تنظیمات پیش‌فرض ازکالا
 * 
 * این فایل شامل تمام تنظیمات پیش‌فرض سیستم است
 * که در اولین اجرا یا با دستور seedDefaults ایجاد می‌شوند
 */

return [
    // ═══════════════════════════════════════════════════════
    // 🌐 General (عمومی)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'site_name',
        'value' => 'ازکالا',
        'group' => 'general',
        'type' => 'text',
        'label' => 'نام سایت',
    ],
    [
        'key' => 'site_description',
        'value' => 'مرجع خرید لوازم جانبی موبایل',
        'group' => 'general',
        'type' => 'textarea',
        'label' => 'توضیحات سایت',
    ],
    [
        'key' => 'site_logo',
        'value' => '',
        'group' => 'general',
        'type' => 'file',
        'label' => 'لوگو سایت',
    ],
    [
        'key' => 'site_favicon',
        'value' => '',
        'group' => 'general',
        'type' => 'file',
        'label' => 'Favicon',
    ],
    [
        'key' => 'support_phone',
        'value' => '021-12345678',
        'group' => 'general',
        'type' => 'text',
        'label' => 'تلفن پشتیبانی',
    ],
    [
        'key' => 'support_email',
        'value' => 'support@azkala.com',
        'group' => 'general',
        'type' => 'email',
        'label' => 'ایمیل پشتیبانی',
    ],
    [
        'key' => 'address',
        'value' => '',
        'group' => 'general',
        'type' => 'textarea',
        'label' => 'آدرس',
    ],
    [
        'key' => 'working_hours',
        'value' => 'شنبه تا پنجشنبه ۹ تا ۱۸',
        'group' => 'general',
        'type' => 'text',
        'label' => 'ساعات کاری',
    ],
    [
        'key' => 'primary_color',
        'value' => '#14b8a6',
        'group' => 'general',
        'type' => 'color',
        'label' => 'رنگ اصلی',
    ],
    [
        'key' => 'accent_color',
        'value' => '#f97316',
        'group' => 'general',
        'type' => 'color',
        'label' => 'رنگ ثانویه',
    ],
    [
        'key' => 'timezone',
        'value' => 'Asia/Tehran',
        'group' => 'general',
        'type' => 'text',
        'label' => 'منطقه زمانی',
    ],
    [
        'key' => 'language',
        'value' => 'fa',
        'group' => 'general',
        'type' => 'text',
        'label' => 'زبان پیش‌فرض',
    ],
    [
        'key' => 'google_analytics',
        'value' => '',
        'group' => 'general',
        'type' => 'text',
        'label' => 'کد گوگل آنالیتیکس',
    ],
    [
        'key' => 'instagram_url',
        'value' => '',
        'group' => 'general',
        'type' => 'url',
        'label' => 'اینستاگرام',
    ],
    [
        'key' => 'telegram_url',
        'value' => '',
        'group' => 'general',
        'type' => 'url',
        'label' => 'تلگرام',
    ],
    [
        'key' => 'twitter_url',
        'value' => '',
        'group' => 'general',
        'type' => 'url',
        'label' => 'توییتر',
    ],

    // ✅ کدهای نماد اعتماد (اینماد/ساماندهی) — عمداً در گروه general قرار
    // گرفتند، نه یک گروه trust جداگانه: AdminSettingsPage.tsx فرانت‌اند
    // فهرست تب‌هایش (general/payment/shipping/tax/notifications/legal/
    // system) را هاردکد کرده، پس یک گروه ناشناخته اصلاً هیچ تبی نمی‌گرفت و
    // ادمین راهی برای دیدن/ویرایششان نداشت. خالی می‌مانند تا وقتی واقعاً از
    // این نهادها مجوز گرفته و کد اختصاصی دریافت شود؛ فوتر فقط با پر بودن
    // این مقدار نماد را نشان می‌دهد.
    [
        'key' => 'enamad_code',
        'value' => '',
        'group' => 'general',
        'type' => 'text',
        'label' => 'کد نماد اعتماد الکترونیکی (اینماد)',
        'description' => 'کد دریافتی از inspect.enamad.ir — تا وقتی خالی باشد، نماد اینماد در فوتر نمایش داده نمی‌شود.',
    ],
    [
        'key' => 'samandehi_code',
        'value' => '',
        'group' => 'general',
        'type' => 'text',
        'label' => 'کد نماد ساماندهی',
        'description' => 'کد دریافتی از سامانه ساماندهی — تا وقتی خالی باشد، نماد ساماندهی در فوتر نمایش داده نمی‌شود.',
    ],

    // ═══════════════════════════════════════════════════════
    // 💳 Payment (پرداخت)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'zarinpal_merchant_id',
        'value' => '',
        'group' => 'payment',
        'type' => 'text',
        'label' => 'Merchant ID زرین‌پال',
        'is_sensitive' => true,
    ],
    [
        'key' => 'zarinpal_enabled',
        'value' => '0',
        'group' => 'payment',
        'type' => 'boolean',
        'label' => 'فعال‌سازی زرین‌پال',
    ],
    [
        'key' => 'zarinpal_sandbox',
        'value' => '1',
        'group' => 'payment',
        'type' => 'boolean',
        'label' => 'حالت تست زرین‌پال',
    ],
    [
        'key' => 'idpay_api_key',
        'value' => '',
        'group' => 'payment',
        'type' => 'text',
        'label' => 'API Key آیدی‌پی',
        'is_sensitive' => true,
    ],
    [
        'key' => 'idpay_enabled',
        'value' => '0',
        'group' => 'payment',
        'type' => 'boolean',
        'label' => 'فعال‌سازی آیدی‌پی',
    ],
    [
        'key' => 'min_order_amount',
        'value' => '10000',
        'group' => 'payment',
        'type' => 'number',
        'label' => 'حداقل مبلغ سفارش (تومان)',
    ],
    [
        'key' => 'max_order_amount',
        'value' => '50000000',
        'group' => 'payment',
        'type' => 'number',
        'label' => 'حداکثر مبلغ سفارش (تومان)',
    ],
    [
        'key' => 'offline_payment_enabled',
        'value' => '1',
        'group' => 'payment',
        'type' => 'boolean',
        'label' => 'پرداخت کارت به کارت',
    ],
    [
        'key' => 'card_number',
        'value' => '',
        'group' => 'payment',
        'type' => 'text',
        'label' => 'شماره کارت (کارت به کارت)',
    ],
    [
        'key' => 'card_holder',
        'value' => '',
        'group' => 'payment',
        'type' => 'text',
        'label' => 'نام صاحب کارت',
    ],

    // ═══════════════════════════════════════════════════════
    // 🚚 Shipping (ارسال)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'post_pishtaz_enabled',
        'value' => '1',
        'group' => 'shipping',
        'type' => 'boolean',
        'label' => 'پست پیش‌تاز',
    ],
    [
        'key' => 'post_pishtaz_cost',
        'value' => '35000',
        'group' => 'shipping',
        'type' => 'number',
        'label' => 'هزینه پست پیش‌تاز (تومان)',
    ],
    [
        'key' => 'tipax_enabled',
        'value' => '0',
        'group' => 'shipping',
        'type' => 'boolean',
        'label' => 'تیپاکس',
    ],
    [
        'key' => 'tipax_cost',
        'value' => '50000',
        'group' => 'shipping',
        'type' => 'number',
        'label' => 'هزینه تیپاکس (تومان)',
    ],
    [
        'key' => 'free_shipping_enabled',
        'value' => '1',
        'group' => 'shipping',
        'type' => 'boolean',
        'label' => 'ارسال رایگان',
    ],
    [
        'key' => 'free_shipping_min_amount',
        'value' => '500000',
        'group' => 'shipping',
        'type' => 'number',
        'label' => 'حداقل مبلغ برای ارسال رایگان',
    ],
    [
        'key' => 'express_delivery_enabled',
        'value' => '0',
        'group' => 'shipping',
        'type' => 'boolean',
        'label' => 'ارسال فوری',
    ],
    [
        'key' => 'express_delivery_cost',
        'value' => '80000',
        'group' => 'shipping',
        'type' => 'number',
        'label' => 'هزینه ارسال فوری',
    ],

    // ═══════════════════════════════════════════════════════
    // 💰 Tax (مالیات)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'vat_enabled',
        'value' => '1',
        'group' => 'tax',
        'type' => 'boolean',
        'label' => 'فعال‌سازی مالیات بر ارزش افزوده',
    ],
    [
        'key' => 'vat_rate',
        'value' => '9',
        'group' => 'tax',
        'type' => 'number',
        'label' => 'نرخ مالیات (%)',
    ],
    [
        'key' => 'price_include_tax',
        'value' => '0',
        'group' => 'tax',
        'type' => 'boolean',
        'label' => 'قیمت‌ها شامل مالیات',
    ],

    // ═══════════════════════════════════════════════════════
    // 🔔 Notifications (اعلان‌ها)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'smtp_host',
        'value' => '',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'SMTP Host',
    ],
    [
        'key' => 'smtp_port',
        'value' => '587',
        'group' => 'notifications',
        'type' => 'number',
        'label' => 'SMTP Port',
    ],
    [
        'key' => 'smtp_username',
        'value' => '',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'SMTP Username',
    ],
    [
        'key' => 'smtp_password',
        'value' => '',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'SMTP Password',
        'is_sensitive' => true,
    ],
    [
        'key' => 'smtp_encryption',
        'value' => 'tls',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'SMTP Encryption',
    ],
    [
        'key' => 'sms_provider',
        'value' => 'kavenegar',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'سرویس پیامک',
    ],
    [
        'key' => 'sms_api_key',
        'value' => '',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'API Key پیامک',
        'is_sensitive' => true,
    ],
    [
        'key' => 'sms_sender_number',
        'value' => '',
        'group' => 'notifications',
        'type' => 'text',
        'label' => 'شماره ارسال پیامک',
    ],
    [
        'key' => 'notify_new_order',
        'value' => '1',
        'group' => 'notifications',
        'type' => 'boolean',
        'label' => 'اعلان سفارش جدید',
    ],
    [
        'key' => 'notify_order_status',
        'value' => '1',
        'group' => 'notifications',
        'type' => 'boolean',
        'label' => 'اعلان تغییر وضعیت سفارش',
    ],
    [
        'key' => 'notify_new_seller',
        'value' => '1',
        'group' => 'notifications',
        'type' => 'boolean',
        'label' => 'اعلان فروشنده جدید',
    ],

    // ═══════════════════════════════════════════════════════
    // ⚖️ Legal (قوانین)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'terms_text',
        'value' => '',
        'group' => 'legal',
        'type' => 'textarea',
        'label' => 'قوانین و مقررات',
    ],
    [
        'key' => 'privacy_text',
        'value' => '',
        'group' => 'legal',
        'type' => 'textarea',
        'label' => 'حریم خصوصی',
    ],
    [
        'key' => 'about_text',
        'value' => '',
        'group' => 'legal',
        'type' => 'textarea',
        'label' => 'درباره ما',
    ],
    [
        'key' => 'warranty_text',
        'value' => '',
        'group' => 'legal',
        'type' => 'textarea',
        'label' => 'گارانتی و بازگشت کالا',
    ],

    // ═══════════════════════════════════════════════════════
    // ⚙️ System (سیستم)
    // ═══════════════════════════════════════════════════════
    [
        'key' => 'maintenance_mode',
        'value' => '0',
        'group' => 'system',
        'type' => 'boolean',
        'label' => 'حالت تعمیر',
    ],
    [
        'key' => 'maintenance_message',
        'value' => 'سایت در حال بروزرسانی است',
        'group' => 'system',
        'type' => 'textarea',
        'label' => 'پیام حالت تعمیر',
    ],
    [
        'key' => 'registration_enabled',
        'value' => '1',
        'group' => 'system',
        'type' => 'boolean',
        'label' => 'فعال‌سازی ثبت‌نام',
    ],
    [
        'key' => 'captcha_enabled',
        'value' => '0',
        'group' => 'system',
        'type' => 'boolean',
        'label' => 'فعال‌سازی CAPTCHA',
    ],
    [
        'key' => 'auto_backup_enabled',
        'value' => '1',
        'group' => 'system',
        'type' => 'boolean',
        'label' => 'پشتیبان‌گیری خودکار',
    ],
    [
        'key' => 'backup_frequency',
        'value' => 'daily',
        'group' => 'system',
        'type' => 'text',
        'label' => 'تناوب پشتیبان‌گیری',
    ],

    // ═══════════════════════════════════════════════════════
    // 📣 Marketing (بازاریابی — نوار اطلاع‌رسانی بالای هدر)
    // ═══════════════════════════════════════════════════════
    // ✅ این ۶ آیتم قبلاً در یک فایل جدای دیگر (config/azkala.php، نه این
    // فایل) تعریف شده بودند. چون Laravel هر دو config/azkala.php و
    // config/azkala/settings_defaults.php را زیر همان مسیر نقطه‌ای یکسان
    // (azkala.settings_defaults) بارگذاری می‌کند، و این پوشه روی آن فایل
    // اولویت دارد، محتوای config/azkala.php کاملاً نادیده گرفته می‌شد —
    // یعنی seedDefaults() هیچ‌وقت این ۶ ردیف را در دیتابیس نمی‌ساخت، حتی
    // اگر ادمین دکمه‌ی «مقداردهی اولیه» را می‌زد. مقدار متن پیش‌فرض
    // announcement_text با همان ۵ پیامی هماهنگ شد که قبلاً به‌صورت هاردکد
    // در Header/index.tsx بودند (رجوع کنید به تغییرات آن فایل) تا ظاهر
    // پیش‌فرض برای نصب‌های تازه عوض نشود.
    [
        'key' => 'announcement_enabled',
        'value' => '1',
        'group' => 'marketing',
        'type' => 'boolean',
        'label' => 'فعال‌سازی نوار اطلاع‌رسانی بالای هدر',
    ],
    [
        'key' => 'announcement_text',
        'value' => 'ارسال رایگان بالای ۵۰۰ هزار تومان | ضمانت اصالت کالا | ۷ روز ضمانت بازگشت | تخفیف ویژه اولین خرید | پشتیبانی ۲۴/۷',
        'group' => 'marketing',
        'type' => 'text',
        'label' => 'متن نوار اطلاع‌رسانی (بخش‌ها را با | جدا کنید)',
    ],
    [
        'key' => 'announcement_link',
        'value' => '',
        'group' => 'marketing',
        'type' => 'text',
        'label' => 'لینک نوار (اختیاری)',
    ],
    [
        'key' => 'announcement_bg_color',
        'value' => 'gradient',
        'group' => 'marketing',
        'type' => 'text',
        'label' => 'رنگ پس‌زمینه (gradient | primary | dark | success)',
    ],
    [
        'key' => 'announcement_show_live_users',
        'value' => '0',
        'group' => 'marketing',
        'type' => 'boolean',
        'label' => 'نمایش تعداد کاربران آنلاین در نوار',
    ],
    [
        'key' => 'seller_request_bg_image',
        'value' => '/images/iran-aerial.jpg',
        'group' => 'general',
        'type' => 'file',
        'label' => 'تصویر پس‌زمینه درخواست فروشندگی',
    ],
];