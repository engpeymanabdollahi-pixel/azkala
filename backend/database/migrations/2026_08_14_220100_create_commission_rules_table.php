<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * قوانین کمیسیون بر اساس سطح عملکرد فروشنده — قابل تنظیم توسط ادمین،
     * نه هاردکد در کد. هر ردیف یک بازه‌ی امتیاز [min_score, max_score] را
     * به یک نرخ کمیسیون نگاشت می‌کند. CommissionService این جدول را
     * می‌خواند؛ تغییر یک ردیف فقط روی محاسبات آینده اثر می‌گذارد — نرخی که
     * قبلاً روی seller_transactions ثبت شده دست‌نخورده می‌ماند (رجوع به
     * ستون‌های audit جدید در مایگریشن seller_transactions).
     */
    public function up(): void
    {
        Schema::create('commission_rules', function (Blueprint $table) {
            $table->id();
            $table->string('level', 30)->unique()->comment('شناسه‌ی سطح: bronze/silver/gold/platinum یا سطح دلخواه دیگر');
            $table->string('label', 100)->comment('برچسب نمایشی فارسی');
            $table->decimal('min_score', 5, 2)->comment('حداقل امتیاز (شامل) برای این سطح، در بازه‌ی ۰ تا ۱۰۰');
            $table->decimal('max_score', 5, 2)->nullable()->comment('حداکثر امتیاز (شامل)؛ NULL یعنی بدون سقف (بالاترین سطح)');
            $table->decimal('commission_rate', 5, 2)->comment('درصد کمیسیون پلتفرم برای این سطح');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // مدل اولیه‌ی درخواستی: هرچه امتیاز عملکرد بالاتر، کمیسیون کمتر.
        // این مقادیر فقط seed پیش‌فرضِ قابل‌تغییر هستند — نه یک واقعیت
        // کسب‌وکاری ثابت‌شده؛ ادمین از طریق API/UI مدیریت Commission Rules
        // می‌تواند بازه‌ها و نرخ‌ها را عوض کند.
        $now = now();
        DB::table('commission_rules')->insert([
            ['level' => 'bronze', 'label' => 'برنزی', 'min_score' => 0, 'max_score' => 49.99, 'commission_rate' => 4.00, 'is_active' => true, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['level' => 'silver', 'label' => 'نقره‌ای', 'min_score' => 50, 'max_score' => 69.99, 'commission_rate' => 3.00, 'is_active' => true, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['level' => 'gold', 'label' => 'طلایی', 'min_score' => 70, 'max_score' => 89.99, 'commission_rate' => 2.00, 'is_active' => true, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['level' => 'platinum', 'label' => 'پلاتینیوم', 'min_score' => 90, 'max_score' => null, 'commission_rate' => 1.00, 'is_active' => true, 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_rules');
    }
};
