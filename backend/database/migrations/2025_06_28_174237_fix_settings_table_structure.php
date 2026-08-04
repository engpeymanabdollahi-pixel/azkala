<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // حذف جدول قدیمی
        Schema::dropIfExists('settings');
        Schema::dropIfExists('setting_histories');

        // ساخت جدول جدید
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general')->index();
            $table->string('type', 20)->default('text');
            $table->string('label', 255)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_locked')->default(false);
            $table->boolean('is_sensitive')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('setting_histories', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key');
            $table->string('group', 50)->index();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note', 255)->nullable();
            $table->string('label', 255)->nullable();
            $table->timestamps();
            
            $table->index('setting_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setting_histories');
        Schema::dropIfExists('settings');
    }
};