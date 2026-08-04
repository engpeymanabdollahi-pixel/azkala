<?php

return [
    /*
    |--------------------------------------------------------------------------
    | مسیرهایی که هدرهای CORS می‌گیرند
    |--------------------------------------------------------------------------
    |
    | فرانت‌اند با baseURL برابر «…/api/v1» کار می‌کند (frontend/src/lib/apiConfig.ts)،
    | پس هر درخواستی از مرورگر زیر api/* می‌افتد — از جمله login و register و
    | verify-otp و logout که پیش‌تر جداگانه اینجا فهرست شده بودند.
    |
    | تنها مسیر ریشه‌ایِ باقی‌مانده GET /login است که یک صفحه‌ی وب است، نه XHR؛
    | پیمایش مرورگر اصلاً مشمول CORS نمی‌شود.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    /*
    | مبدأها از env خوانده می‌شوند، با جدا‌کننده‌ی کاما — همان الگویی که
    | config/sanctum.php برای SANCTUM_STATEFUL_DOMAINS به کار می‌برد.
    |
    | تا پیش از این مقدارها به localhost:5173 هاردکد شده بود، یعنی روی production
    | که فرانت‌اند از دامنه‌ی دیگری می‌آید، مرورگر همه‌ی پاسخ‌ها را بلاک می‌کرد.
    | مقدار پیش‌فرض همان محیط توسعه است تا چیزی برای کار لوکال لازم نباشد.
    */

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // برای Sanctum حیاتی است: بدون این، مرورگر کوکی نشست را همراه درخواست
    // نمی‌فرستد و هر تماس احرازشده ۴۰۱ می‌گیرد.
    'supports_credentials' => true,
];
