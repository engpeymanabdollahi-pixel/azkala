<?php

return [
    // تمام مسیرهای API و مسیرهای خاص احراز هویت
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'verify-otp', 'register'],

    'allowed_methods' => ['*'],

    // آدرس دقیق فرانت‌اند شما
    'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // این خط برای Sanctum و ارسال کوکی‌ها حیاتی است
    'supports_credentials' => true,
];