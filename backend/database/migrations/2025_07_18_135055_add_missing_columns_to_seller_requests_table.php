<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('seller_requests', 'id_card_image')) {
                $table->string('id_card_image')->nullable()->after('shop_name');
            }
            if (!Schema::hasColumn('seller_requests', 'business_license')) {
                $table->string('business_license')->nullable();
            }
            if (!Schema::hasColumn('seller_requests', 'national_code')) {
                $table->string('national_code')->nullable();
            }
            if (!Schema::hasColumn('seller_requests', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('seller_requests', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
            if (!Schema::hasColumn('seller_requests', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('seller_requests', function (Blueprint $table) {
            $table->dropColumn(['id_card_image', 'business_license', 'national_code', 'reviewed_by', 'reviewed_at', 'rejection_reason']);
        });
    }
};