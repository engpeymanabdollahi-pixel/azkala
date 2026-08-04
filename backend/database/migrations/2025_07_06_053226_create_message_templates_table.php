<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('category')->default('general');
            $table->string('icon')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false); // قالب‌های سیستمی قابل حذف نیستند
            $table->integer('usage_count')->default(0);
            $table->integer('priority')->default(0);
            $table->json('variables')->nullable(); // لیست متغیرهای استفاده شده
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
    }
};