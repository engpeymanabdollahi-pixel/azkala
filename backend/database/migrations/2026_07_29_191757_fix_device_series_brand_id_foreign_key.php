<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('device_series', function (Blueprint $table) {
            // ۱. حذف کلید خارجی اشتباه قبلی
            $table->dropForeign(['brand_id']);
            
            // ۲. ایجاد کلید خارجی صحیح روی ستون موجود (بدون تلاش برای ساخت مجدد ستون)
            $table->foreign('brand_id')
                  ->references('id')
                  ->on('device_brands') // ✅ اشاره به جدول صحیح
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('device_series', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->foreign('brand_id')
                  ->references('id')
                  ->on('brands') // بازگشت به حالت قبلی
                  ->onDelete('cascade');
        });
    }
};