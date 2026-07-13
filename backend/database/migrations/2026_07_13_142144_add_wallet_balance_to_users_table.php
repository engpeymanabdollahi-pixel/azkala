<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'wallet_balance')) {
                $table->decimal('wallet_balance', 12, 2)->default(0.00)->after('email')->comment('موجودی کیف پول فروشنده');
            }
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('wallet_balance');
        });
    }
};