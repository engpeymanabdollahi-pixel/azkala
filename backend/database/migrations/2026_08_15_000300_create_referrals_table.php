<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * سیستم Referral — Phase 2 (فقط هسته: capture + pending).
     *
     * هر ردیف یک رخداد «معرفی» است، نه یک فکت ساکن روی users — چون
     * status/registered_at/qualified_at/rewarded_at سه لحظه‌ی زمانی
     * کاملاً متفاوت‌اند (ثبت‌نام ≠ دعوت موفق ≠ پاداش) و هیچ‌کدام را نمی‌شود
     * در یک ستون تنها روی users خلاصه کرد. جدول مستقل هم مسیر رشد آینده
     * (Campaign، Reward Engine) را بدون شکستن این طراحی باز نگه می‌دارد.
     *
     * این فاز فقط pending تولید می‌کند؛ qualified/rewarded/cancelled/
     * rejected از همین الان در enum هستند تا فاز بعدی نیازی به تغییر
     * schema نداشته باشد، اما امروز هیچ کدی آن‌ها را set نمی‌کند.
     */
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();

            // ✅ nullOnDelete نه cascade (دقیقاً همان الگوی
            // admin_access_logs.actor_user_id/target_user_id) — حذف نرم
            // یا سخت هر یک از دو طرف نباید تاریخچه‌ی Referral را نابود کند.
            $table->foreignId('referrer_user_id')->nullable()->constrained('users')->nullOnDelete();

            // ✅ unique: «یک کاربر فقط یک‌بار می‌تواند توسط یک Referral
            // Code معرفی شود» — این قانون در سطح دیتابیس enforce می‌شود،
            // نه فقط در Service (که خودش هم قبل از insert چک می‌کند، اما
            // این constraint تنها تضمین واقعی در برابر race condition است).
            $table->foreignId('referred_user_id')->nullable()->unique()->constrained('users')->nullOnDelete();

            // Snapshot خودِ کد استفاده‌شده در لحظه‌ی معرفی — even اگر
            // کد referrer در آینده (مثلاً توسط ادمین) عوض شود، تاریخچه‌ی
            // این ردیف دست‌نخورده می‌ماند.
            $table->string('referral_code', 8);

            $table->enum('status', ['pending', 'qualified', 'rewarded', 'cancelled', 'rejected'])
                ->default('pending');

            // ✅ campaign_id از همین الان (nullable، بدون FK فعال) — افزودن
            // یک ستون nullable امروز تقریباً هزینه‌ی صفر دارد؛ افزودنش بعداً
            // یعنی migration جدید + backfill روی جدولی که ممکن است بزرگ
            // شده باشد. جدول referral_campaigns در این فاز ساخته نمی‌شود؛
            // این فقط جای رشد است، نه یک FK فعال (تا وقتی آن جدول واقعاً
            // وجود نداشته باشد، constrained() اینجا اشتباه است).
            $table->unsignedBigInteger('campaign_id')->nullable();

            $table->timestamp('registered_at');
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('rewarded_at')->nullable();

            $table->timestamps();

            $table->index('referrer_user_id');
            $table->index('referral_code');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
