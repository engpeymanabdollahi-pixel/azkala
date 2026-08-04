<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // فقط اگر ستون وجود نداشت، اضافه کن
            if (!Schema::hasColumn('users', 'slug')) {
                $table->string('slug')->unique()->nullable()->after('name');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'slug')) {
                $table->dropColumn('slug');
            }
        });
    }
};