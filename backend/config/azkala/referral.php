<?php

/**
 * تنظیمات پاداش سیستم Referral — Phase 3.
 *
 * منبع حقیقت واحد برای مبلغ پاداش؛ هیچ کنترلر/سرویس/فرانت‌اندی نباید
 * این عدد را دوباره هاردکد کند — همیشه از
 * config('azkala.referral.reward.amount') خوانده می‌شود
 * (ReferralRewardService). واحد پول همان قرارداد موجود این پروژه است:
 * تومان (رجوع به config/azkala/order.php — free_shipping_threshold/
 * default_shipping_cost هم دقیقاً به همین واحد و همین الگوی env()اند؛
 * هیچ واحد پول جدیدی اینجا اختراع نشده).
 *
 * برای تغییر مبلغ پیش‌فرض، کافی است env REFERRAL_REWARD_AMOUNT را در
 * .env تنظیم کنید — نیازی به تغییر کد نیست.
 */
return [
    'reward' => [
        // امروز تنها نوع پشتیبانی‌شده — یک اعتبار ثابت (نه درصدی از
        // سفارش). رجوع به ReferralReward::TYPE_FIXED_CREDIT.
        'type' => 'fixed_credit',

        // پیش‌فرض: ۵۰,۰۰۰ تومان — هم‌مقیاس با default_shipping_cost
        // موجود این پروژه (config/azkala/order.php)، صرفاً به‌عنوان یک
        // نقطه‌ی شروع معقول؛ به‌راحتی از طریق env قابل تغییر است.
        'amount' => (float) env('REFERRAL_REWARD_AMOUNT', 50000),
    ],
];
