<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * قابل-ممیزی‌بودن کمیسیون: تا امروز seller_transactions فقط مبلغ کسر
     * کمیسیون را ذخیره می‌کرد (commission_deducted)، نه اینکه *چرا* آن نرخ
     * اعمال شده — نرخ چند درصد بود، از override دستی آمده یا از قانون
     * امتیازی، و اگر از قانون آمده سطح فروشنده در آن لحظه چه بود. بدون
     * این‌ها اگر بعداً Commission Rule عوض شود، هیچ راهی برای توضیح یک
     * تسویه‌ی قدیمی («چرا اینجا ۲٪ کسر شده؟») وجود نداشت.
     *
     * این ستون‌ها فقط برای رکوردهای *جدید* پر می‌شوند؛ تراکنش‌های قدیمی
     * NULL می‌مانند (دقیقاً چون داده‌ی واقعی نرخ/منبع آن‌ها هیچ‌جا ثبت
     * نشده بود و نباید حدس زده شود) — این خودش تضمین می‌کند که تغییر Rule
     * در آینده هیچ تراکنش قبلی را دوباره محاسبه/تغییر نمی‌دهد.
     */
    public function up(): void
    {
        Schema::table('seller_transactions', function (Blueprint $table) {
            $table->decimal('commission_rate', 5, 2)->nullable()->after('commission_deducted')
                ->comment('درصد کمیسیونی که واقعاً در همین تراکنش اعمال شد');
            $table->string('commission_source', 20)->nullable()->after('commission_rate')
                ->comment('override | score_rule | default — از کجا این نرخ آمد');
            $table->string('seller_level', 30)->nullable()->after('commission_source')
                ->comment('سطح فروشنده (bronze/silver/gold/platinum) در لحظه‌ی این تسویه، اگر از score_rule آمده باشد');
        });
    }

    public function down(): void
    {
        Schema::table('seller_transactions', function (Blueprint $table) {
            $table->dropColumn(['commission_rate', 'commission_source', 'seller_level']);
        });
    }
};
