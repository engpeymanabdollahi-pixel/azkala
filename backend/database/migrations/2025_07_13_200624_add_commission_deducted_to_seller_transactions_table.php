<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('seller_transactions', function (Blueprint $table) {
        $table->unsignedBigInteger('commission_deducted')->default(0)->after('amount');
    });
}

public function down()
{
    Schema::table('seller_transactions', function (Blueprint $table) {
        $table->dropColumn('commission_deducted');
    });
}
};
