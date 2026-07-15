<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            // بررسی و افزودن ستون‌ها فقط در صورتی که وجود نداشته باشند
            if (!Schema::hasColumn('seller_requests', 'user_id')) {
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('seller_requests', 'shop_name')) {
                $table->string('shop_name');
            }
            if (!Schema::hasColumn('seller_requests', 'national_code')) {
                $table->string('national_code', 15);
            }
            if (!Schema::hasColumn('seller_requests', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('seller_requests', 'status')) {
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            }
        });
    }

    public function down()
    {
        // در صورت نیاز به بازگشت، ستون‌ها را حذف می‌کنیم (اختیاری)
        Schema::table('seller_requests', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'shop_name', 'national_code', 'description', 'status']);
        });
    }
};