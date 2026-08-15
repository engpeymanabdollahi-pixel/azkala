<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Audit trail برای هر تغییر در Administrative Access (سیستم جدید
     * Multi-Admin/Manager). الگوی این جدول از SettingHistory (که همین
     * کار را برای تغییرات Setting انجام می‌دهد) الهام گرفته شده، ولی
     * جدول جداگانه است چون schema اش ماهیتاً متفاوت است (actor/target
     * دو کاربر مجزا، نه یک setting_key) — یک ستون setting_key اینجا
     * معنا نداشت.
     *
     * غیرقابل‌تغییر (append-only) در نظر گرفته می‌شود: هیچ Service ای
     * قرار نیست ردیف‌های این جدول را update/delete کند.
     */
    public function up(): void
    {
        Schema::create('admin_access_logs', function (Blueprint $table) {
            $table->id();

            // ✅ nullOnDelete نه cascade: اگر بعداً اکانت actor حذف شد،
            // خودِ لاگ (شاهد تاریخی رویداد) باید باقی بماند.
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();

            // admin_role_assigned | admin_role_removed | permission_granted | permission_revoked
            $table->string('action', 50);

            // مقدار قبل/بعد — برای role یک رشته‌ی ساده (مثلاً 'manager')،
            // برای permission یک آرایه‌ی JSON از نام‌های permission.
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();

            $table->timestamps();

            $table->index(['actor_user_id', 'created_at']);
            $table->index(['target_user_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_access_logs');
    }
};
