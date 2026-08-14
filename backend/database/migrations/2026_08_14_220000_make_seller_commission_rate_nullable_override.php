<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ users.seller_commission_rate پیش‌تر default(5.00) و not-null بود
     * (مایگریشن add_seller_commission_rate_to_users_table) — یعنی همیشه یک
     * مقدار غیر NULL داشت، حتی وقتی هیچ ادمینی هرگز آن را دستی تنظیم نکرده
     * بود؛ این ستون اصلاً fillable هم نیست و در کل کدبیس هیچ کنترلر/فرم
     * ادمینی برای نوشتن مقدار دلخواه در آن وجود نداشت (فقط همین مایگریشن
     * پیش‌فرض 5.00 را می‌گذاشت). یعنی «5.00» یک override واقعی نبود، فقط
     * نویز باقی‌مانده از مایگریشن بود.
     *
     * سیستم کمیسیون جدید این ستون را دقیقاً به همان معنایی که در دستور کار
     * آمده تفسیر می‌کند: «اگر override واقعی و معتبر وجود دارد» یعنی مقدار
     * غیر NULL. برای اینکه این تفسیر از روز اول درست کار کند (نه اینکه هر
     * فروشنده‌ی موجود تا ابد کمیسیون ۵٪ قفل‌شده بگیرد، بالاتر از حتی سطح
     * Bronze سیستم امتیازی)، ستون nullable می‌شود، پیش‌فرض NULL می‌گیرد، و
     * مقادیر فعلی که دقیقاً برابر همان پیش‌فرض قدیمی (5.00) هستند به NULL
     * تبدیل می‌شوند — چون هیچ‌کدام محصول یک تصمیم واقعی ادمین نبودند.
     *
     * توجه: این تغییر روی seller_transactions یا هیچ تراکنش قبلی اثر
     * نمی‌گذارد؛ فقط تفسیر ستون کانفیگ سطح User را اصلاح می‌کند. اگر در
     * آینده مقداری غیر از 5.00 برای یک فروشنده در دیتابیس دیده شود (که طبق
     * بررسی فعلاً هیچ‌جا این‌طور نبوده)، دست‌نخورده می‌ماند — چون آن واقعاً
     * می‌تواند یک override دستی (مثلاً از طریق tinker/db) باشد.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('seller_commission_rate', 5, 2)->nullable()->default(null)->change();
        });

        DB::table('users')
            ->where('role', 'seller')
            ->where('seller_commission_rate', 5.00)
            ->update(['seller_commission_rate' => null]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('seller_commission_rate', 5, 2)->default(5.00)->nullable(false)->change();
        });

        DB::table('users')
            ->where('role', 'seller')
            ->whereNull('seller_commission_rate')
            ->update(['seller_commission_rate' => 5.00]);
    }
};
