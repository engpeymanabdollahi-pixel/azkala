<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ قبلاً status از نوع enum فقط pending/processing/shipped/delivered/cancelled
     * را می‌پذیرفت. در پنل ادمین (فرانت‌اند) گزینهٔ «مرجوعی» (returned) در
     * فیلتر و در مودال تغییر وضعیت کاملاً پیاده‌سازی شده بود و کارت آمار
     * getStats() هم از قبل 'returned' را می‌شمرد، اما چون این مقدار هرگز
     * در enum دیتابیس وجود نداشت، ثبت وضعیت «مرجوعی» همیشه با خطای اعتبارسنجی
     * ۴۲۲ شکست می‌خورد — یک دکمهٔ کاملاً مرده در پنل ادمین.
     *
     * تبدیل ستون از enum به string هم این مشکل را برای همیشه حل می‌کند و هم
     * از قفل‌شدن دوبارهٔ لیست وضعیت‌ها در سطح دیتابیس جلوگیری می‌کند —
     * اعتبارسنجی واقعی همان‌طور که در AdminOrderController وجود دارد در
     * لایهٔ Request باقی می‌ماند.
     */
    public function up(): void
    {
        // ✅ Laravel از نسخه ۱۱ به بعد تغییر نوع ستون در SQLite را خودش با
        // بازسازی جدول (و حفظ ایندکس‌ها) مدیریت می‌کند؛ نیازی به رویکرد
        // دستی drop/rename نیست.
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->change();
        });
    }

    public function down(): void
    {
        DB::statement("UPDATE orders SET status = 'pending' WHERE status NOT IN ('pending','processing','shipped','delivered','cancelled')");

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
                    ->default('pending')
                    ->change();
            });
        } else {
            DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'");
        }
    }
};
