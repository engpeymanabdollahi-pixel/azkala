<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            // افزودن ستون دلیل رد درخواست (اگر وجود ندارد)
            if (!Schema::hasColumn('seller_requests', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('status');
            }
            
            // افزودن ستون آیدی ادمین بررسی‌کننده (اگر وجود ندارد)
            if (!Schema::hasColumn('seller_requests', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable()->after('rejection_reason');
            }
            
            // افزودن ستون زمان بررسی (اگر وجود ندارد)
            if (!Schema::hasColumn('seller_requests', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            $table->dropColumn(['rejection_reason', 'reviewed_by', 'reviewed_at']);
        });
    }
};