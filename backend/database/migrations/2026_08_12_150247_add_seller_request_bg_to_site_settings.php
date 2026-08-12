<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ اضافه کردن تنظیم تصویر پس‌زمینه صفحه درخواست فروشندگی
     * این تنظیم از پنل Admin Settings قابل ویرایش است.
     */
    public function up(): void
    {
        // بررسی وجود جدول site_settings
        if (!Schema::hasTable('site_settings')) {
            return; // اگر جدول نیست، رد شو
        }

        // اضافه کردن رکورد (اگر وجود ندارد)
        $exists = DB::table('site_settings')
            ->where('key', 'seller_request_bg_image')
            ->exists();

        if (!$exists) {
            DB::table('site_settings')->insert([
                'key' => 'seller_request_bg_image',
                'value' => '/images/iran-aerial.jpg',
                'group' => 'seller',
                'type' => 'image',
                'label' => 'تصویر پس‌زمینه صفحه درخواست فروشندگی',
                'description' => 'تصویر هوایی که در پس‌زمینه فرم درخواست افتتاح شعبه نمایش داده می‌شود',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('site_settings')) {
            DB::table('site_settings')
                ->where('key', 'seller_request_bg_image')
                ->delete();
        }
    }
};