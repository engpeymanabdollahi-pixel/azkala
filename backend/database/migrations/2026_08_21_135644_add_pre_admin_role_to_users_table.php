<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ فاز ۷: ذخیره نقش اصلی کاربر قبل از admin شدن.
     *
     * وقتی یک customer/seller به admin تبدیل می‌شود، نقش قبلی‌اش اینجا
     * ذخیره می‌شود تا هنگام بازگرداندن به user عادی (حذف Administrative
     * Role) بتوانیم users.role را به مقدار اصلی برگردانیم — نه اینکه
     * همیشه 'customer' فرض کنیم (یک seller باید seller برگردد).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pre_admin_role')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pre_admin_role');
        });
    }
};