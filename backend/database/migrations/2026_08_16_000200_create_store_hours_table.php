<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ساعات کاری هفتگی هر فروشگاه — حداکثر یک ردیف به‌ازای هر
     * (store_id, day_of_week). طبق دستور صریح («holiday calendar را در
     * این فاز over-engineer نکن») فقط چرخه‌ی ساده‌ی هفتگی است، بدون
     * تقویم تعطیلات/استثنای تاریخ خاص.
     */
    public function up(): void
    {
        Schema::create('store_hours', function (Blueprint $table) {
            $table->id();

            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();

            // ✅ cascadeOnDelete اینجا (برخلاف stores.seller_id) درست
            // است: store_hours بدون store والدش هیچ معنایی ندارد — این
            // یک رکورد تاریخی/audit نیست، صرفاً جزئی از تعریف خودِ
            // فروشگاه است؛ حذف فروشگاه باید ساعاتش را هم پاک کند.
            $table->unsignedTinyInteger('day_of_week'); // 0=یکشنبه ... 6=شنبه (Carbon::dayOfWeek)
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);

            $table->timestamps();

            $table->unique(['store_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_hours');
    }
};
