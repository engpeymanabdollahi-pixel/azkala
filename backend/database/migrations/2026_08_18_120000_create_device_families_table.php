<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ✅ Device-First Architecture — Phase 1A: DeviceFamily یک موجودیت درجه‌یک
// بالای DeviceBrand است (Smartphone / Laptop / Tablet / ... در آینده هر
// اکوسیستم دیگری بدون تغییر کد). این جدول تنها منبع حقیقتِ «نوع اکوسیستم
// دستگاه» است — DeviceBrand.type قدیمی موقتاً باقی می‌ماند (فاز ۱D) و در
// یک migration جداگانه‌ی پاکسازی حذف خواهد شد.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_families', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            // نام/اسلاگ آیکون (مثلاً از یک ست آیکون شناخته‌شده در فرانت‌اند)،
            // نه خودِ فایل تصویر — سبک و کافی برای یک بج/انتخابگر.
            $table->string('icon')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_families');
    }
};
