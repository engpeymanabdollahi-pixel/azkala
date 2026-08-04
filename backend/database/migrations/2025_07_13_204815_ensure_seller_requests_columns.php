<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // حالت اول: اگر جدول اصلاً وجود ندارد (مثل محیط تست یا نصب تازه)
        if (!Schema::hasTable('seller_requests')) {
            Schema::create('seller_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('shop_name');
                $table->string('national_code', 15);
                $table->string('phone')->nullable(); // اضافه شده بر اساس فرم فرانت‌اند
                $table->text('description')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->timestamps();
            });
        } 
        // حالت دوم: اگر جدول وجود دارد (مثل دیتابیس محلی شما)، فقط ستون‌های گمشده را اضافه کن
        else {
            Schema::table('seller_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('seller_requests', 'user_id')) {
                    $table->foreignId('user_id')->constrained()->onDelete('cascade');
                }
                if (!Schema::hasColumn('seller_requests', 'shop_name')) {
                    $table->string('shop_name');
                }
                if (!Schema::hasColumn('seller_requests', 'national_code')) {
                    $table->string('national_code', 15);
                }
                if (!Schema::hasColumn('seller_requests', 'phone')) {
                    $table->string('phone')->nullable();
                }
                if (!Schema::hasColumn('seller_requests', 'description')) {
                    $table->text('description')->nullable();
                }
                if (!Schema::hasColumn('seller_requests', 'status')) {
                    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('seller_requests')) {
            Schema::dropIfExists('seller_requests');
        }
    }
};