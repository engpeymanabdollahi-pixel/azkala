<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('device_series', function (Blueprint $table) {
            // ۱. تلاش برای حذف کلید خارجی قدیمی با دستور خام SQL
            try {
                DB::statement('ALTER TABLE device_series DROP FOREIGN KEY device_series_brand_id_foreign');
            } catch (\Exception $e) {
                // اگر کلید خارجی وجود نداشت، خطا نادیده گرفته می‌شود و اجرا ادامه می‌یابد.
                // این همان خطایی است که می‌خواستیم از آن جلوگیری کنیم.
            }

            // ۲. ایجاد کلید خارجی صحیح به جدول device_brands
            $table->foreign('brand_id')
                  ->references('id')
                  ->on('device_brands')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('device_series', function (Blueprint $table) {
            try {
                $table->dropForeign(['brand_id']);
            } catch (\Exception $e) {
                // نادیده گرفتن خطا در حالت بازگشت
            }
        });
    }
};