<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->text('admin_reply')->nullable()->after('status');
            $table->foreignId('replied_by')->nullable()->after('admin_reply')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('replied_at')->nullable()->after('replied_by');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['admin_reply', 'replied_by', 'replied_at']);
        });
    }
};