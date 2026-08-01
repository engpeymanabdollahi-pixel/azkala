<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // تغییر نوع ستون به JSON برای ذخیره‌سازی صحیح مشخصات فنی
            // نکته: اگر از Laravel 11 استفاده می‌کنید و doctrine/dbal نصب نیست، 
            // ممکن است نیاز به نصب آن باشد: composer require doctrine/dbal
            $table->json('specifications')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // بازگشت به حالت قبلی در صورت نیاز به Rollback
            $table->string('specifications')->nullable()->change();
        });
    }
};