<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * اسنپ‌شات فعلیِ امتیاز عملکرد هر فروشنده — یک ردیف به‌ازای هر فروشنده،
     * با recalculate بازنویسی می‌شود (upsert). breakdown برای شفافیت/قابل
     * ممیزی بودن محاسبه نگه‌داری می‌شود (چرا این امتیاز، بر چه اساسی).
     *
     * این جدول عمداً یک snapshot زنده است، نه یک لاگ تاریخی کامل؛ چون آنچه
     * واقعاً باید غیرقابل‌تغییر بماند («audit trail») نرخ کمیسیونی است که
     * در لحظه‌ی هر تسویه‌ی واقعی روی seller_transactions ثبت می‌شود، نه
     * تاریخچه‌ی نوسان امتیاز.
     */
    public function up(): void
    {
        Schema::create('seller_performance_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->decimal('score', 5, 2)->comment('امتیاز نهایی وزن‌دار، ۰ تا ۱۰۰');
            $table->string('level', 30)->nullable()->comment('سطح متناظر طبق commission_rules در لحظه‌ی محاسبه');

            // مؤلفه‌های خام برای شفافیت محاسبه (هرکدام ۰ تا ۱۰۰، پیش از اعمال وزن)
            $table->decimal('rating_component', 5, 2)->default(0);
            $table->decimal('success_rate_component', 5, 2)->default(0);
            $table->decimal('cancellation_component', 5, 2)->default(0);
            $table->decimal('quality_component', 5, 2)->default(0);
            $table->decimal('reliability_component', 5, 2)->default(0);

            // آمار خام پشتیبان محاسبه (برای نمایش/دیباگ در ادمین)
            $table->unsignedInteger('total_orders')->default(0);
            $table->unsignedInteger('successful_orders')->default(0);
            $table->unsignedInteger('cancelled_orders')->default(0);

            $table->boolean('is_new_seller')->default(false)->comment('true یعنی سابقه‌ی کافی برای محاسبه‌ی واقعی نبوده و از مقدار پیش‌فرض استفاده شده');

            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_performance_scores');
    }
};
