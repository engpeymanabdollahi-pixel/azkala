<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'seller_commission_rate')) {
                $table->decimal('seller_commission_rate', 5, 2)->default(5.00)->after('role')->comment('درصد کمیسیون پلتفرم برای فروشندگان');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('seller_commission_rate');
        });
    }
};