<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            // فقط اگر ستون وجود نداشت، اضافه کن
            if (!Schema::hasColumn('seller_requests', 'id_card_image')) {
                $table->string('id_card_image')->nullable()->after('phone');
            }
            
            if (!Schema::hasColumn('seller_requests', 'business_license_image')) {
                $table->string('business_license_image')->nullable()->after('id_card_image');
            }
            
            // تغییر نوع status به string برای پشتیبانی از وضعیت‌های جدید
            if (Schema::hasColumn('seller_requests', 'status')) {
                $table->string('status')->default('pending_initial')->change();
            }
        });
    }

    public function down()
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            if (Schema::hasColumn('seller_requests', 'id_card_image')) {
                $table->dropColumn('id_card_image');
            }
            if (Schema::hasColumn('seller_requests', 'business_license_image')) {
                $table->dropColumn('business_license_image');
            }
        });
    }
};