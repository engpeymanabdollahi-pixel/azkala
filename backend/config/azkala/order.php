<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Order Calculation Settings
    |--------------------------------------------------------------------------
    | این مقادیر را می‌توانید بعداً از طریق پنل ادمین (جدول settings) خوانده و
    | در کش نگه دارید. فعلاً به عنوان منبع حقیقت (Single Source of Truth) استفاده می‌شوند.
    */
    'free_shipping_threshold' => env('ORDER_FREE_SHIPPING_THRESHOLD', 500000),
    'default_shipping_cost' => env('ORDER_DEFAULT_SHIPPING_COST', 50000),
    'tax_rate' => env('ORDER_TAX_RATE', 9), // درصد
    'default_commission_rate' => env('ORDER_DEFAULT_COMMISSION_RATE', 5), // درصد
];