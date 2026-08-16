<?php

/**
 * Permission Taxonomy سیستم Multi-Admin/Manager ازکالا.
 *
 * منبع حقیقت (single source of truth) برای:
 *   - AdministrativeAccessSeeder (ساخت واقعی ردیف‌های Permission در DB)
 *   - AdminAccessController::permissions() (نمایش دسته‌بندی‌شده در UI)
 *
 * هر ماژول یک لیست از permission ها دارد؛ 'sensitive' صرفاً برای UI است
 * (دسته‌بندی View/Manage/Sensitive در صفحه‌ی مدیریت Administrative
 * Access — بخش ۲۳ درخواست) و به کاربر/ادمین علامت می‌دهد این عملیات
 * حساس/پرریسک است؛ این flag به‌تنهایی تعیین‌کننده‌ی تخصیص پیش‌فرض
 * Role «admin» نیست (آن تصمیم مستقل و صریح در
 * database/seeders/AdministrativeAccessSeeder.php با لیست کوچک
 * `$superAdminOnlyByDefault` گرفته می‌شود — رجوع به کامنت آن‌جا).
 * نقش 'super_admin' همیشه همه‌چیز را دارد، و نقش 'manager' به‌صورت
 * پیش‌فرض هیچ Permission ای ندارد.
 */
return [
    'users' => [
        'label' => 'کاربران',
        'permissions' => [
            'users.view' => ['label' => 'مشاهده کاربران', 'sensitive' => false],
            'users.manage' => ['label' => 'مدیریت کاربران (فعال/غیرفعال)', 'sensitive' => false],
            'users.role.manage' => ['label' => 'تغییر نقش کاربر (customer/seller/admin)', 'sensitive' => true],
        ],
    ],
    'sellers' => [
        'label' => 'فروشندگان',
        'permissions' => [
            'sellers.view' => ['label' => 'مشاهده درخواست‌های فروشندگی', 'sensitive' => false],
            'sellers.manage' => ['label' => 'تایید/رد فروشندگی', 'sensitive' => false],
        ],
    ],
    'stores' => [
        'label' => 'فروشگاه‌های فیزیکی',
        'permissions' => [
            'stores.view' => ['label' => 'مشاهده فروشگاه‌های فیزیکی', 'sensitive' => false],
            'stores.manage' => ['label' => 'تایید/رد/غیرفعال‌سازی فروشگاه فیزیکی', 'sensitive' => false],
        ],
    ],
    'orders' => [
        'label' => 'سفارشات',
        'permissions' => [
            'orders.view' => ['label' => 'مشاهده سفارشات', 'sensitive' => false],
            'orders.manage' => ['label' => 'تغییر وضعیت سفارش', 'sensitive' => false],
            'orders.payment.manage' => ['label' => 'تغییر وضعیت پرداخت سفارش', 'sensitive' => true],
        ],
    ],
    'products' => [
        'label' => 'محصولات',
        'permissions' => [
            'products.view' => ['label' => 'مشاهده محصولات', 'sensitive' => false],
            'products.manage' => ['label' => 'مدیریت محصولات (ویرایش/حذف/bulk)', 'sensitive' => false],
        ],
    ],
    'catalog' => [
        'label' => 'کاتالوگ',
        'permissions' => [
            'catalog.view' => ['label' => 'مشاهده کاتالوگ (دسته/برند/دستگاه)', 'sensitive' => false],
            'catalog.manage' => ['label' => 'مدیریت کاتالوگ', 'sensitive' => false],
        ],
    ],
    'reviews' => [
        'label' => 'نظرات',
        'permissions' => [
            'reviews.view' => ['label' => 'مشاهده نظرات', 'sensitive' => false],
            'reviews.manage' => ['label' => 'مدیریت نظرات (تایید/رد/پاسخ/حذف)', 'sensitive' => false],
        ],
    ],
    'content' => [
        'label' => 'محتوا (مجله)',
        'permissions' => [
            'content.view' => ['label' => 'مشاهده مجله', 'sensitive' => false],
            'content.manage' => ['label' => 'مدیریت مجله (شامل تولید AI)', 'sensitive' => false],
        ],
    ],
    'ads' => [
        'label' => 'تبلیغات',
        'permissions' => [
            'ads.view' => ['label' => 'مشاهده تبلیغات', 'sensitive' => false],
            'ads.manage' => ['label' => 'مدیریت تبلیغات', 'sensitive' => false],
        ],
    ],
    'coupons' => [
        'label' => 'کدهای تخفیف',
        'permissions' => [
            'coupons.view' => ['label' => 'مشاهده کدهای تخفیف', 'sensitive' => false],
            'coupons.manage' => ['label' => 'مدیریت کدهای تخفیف', 'sensitive' => false],
        ],
    ],
    'support' => [
        'label' => 'پشتیبانی و چت',
        'permissions' => [
            'support.view' => ['label' => 'مشاهده چت/تیکت/گزارش‌ها', 'sensitive' => false],
            'support.manage' => ['label' => 'مدیریت چت/تیکت/FAQ/Push', 'sensitive' => false],
        ],
    ],
    'reports' => [
        'label' => 'گزارش‌ها',
        'permissions' => [
            'reports.view' => ['label' => 'مشاهده گزارش‌ها', 'sensitive' => false],
            'reports.export' => ['label' => 'خروجی‌گیری گزارش‌ها (Excel/PDF)', 'sensitive' => false],
        ],
    ],
    'finance' => [
        'label' => 'مالی',
        'permissions' => [
            'finance.view' => ['label' => 'مشاهده اطلاعات مالی', 'sensitive' => true],
            'finance.manage' => ['label' => 'مدیریت عملیات مالی', 'sensitive' => true],
            'finance.payout' => ['label' => 'تسویه‌حساب فروشندگان (Payout)', 'sensitive' => true],
        ],
    ],
    'commission' => [
        'label' => 'کمیسیون',
        'permissions' => [
            'commission.view' => ['label' => 'مشاهده قوانین کمیسیون', 'sensitive' => false],
            'commission.rules.manage' => ['label' => 'ویرایش قوانین کمیسیون', 'sensitive' => true],
            'commission.override.view' => ['label' => 'مشاهده Override کمیسیون فروشنده', 'sensitive' => false],
            'commission.override.manage' => ['label' => 'تنظیم Override کمیسیون فروشنده', 'sensitive' => true],
        ],
    ],
    'settings' => [
        'label' => 'تنظیمات سیستم',
        'permissions' => [
            'settings.view' => ['label' => 'مشاهده تنظیمات', 'sensitive' => false],
            'settings.manage' => ['label' => 'مدیریت تنظیمات سیستم', 'sensitive' => true],
        ],
    ],
    'admin_access' => [
        'label' => 'دسترسی مدیریتی',
        'permissions' => [
            'admin.access.view' => ['label' => 'مشاهده نقش/دسترسی ادمین‌ها', 'sensitive' => false],
            'admin.access.manage' => ['label' => 'مدیریت نقش/دسترسی ادمین‌ها', 'sensitive' => true],
        ],
    ],
];
