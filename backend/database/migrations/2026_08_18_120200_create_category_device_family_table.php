<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// ✅ Device-First Architecture — Phase 1I: رابطه‌ی چندبه‌چند
// Category ↔ DeviceFamily. مثال: دسته‌ی «شارژر و کابل» می‌تواند هم‌زمان
// به Smartphone هم Laptop هم Tablet وصل باشد.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_device_family', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('device_family_id')->constrained('device_families')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['category_id', 'device_family_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_device_family');
    }
};
