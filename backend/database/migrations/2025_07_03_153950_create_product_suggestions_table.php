<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('suggested_by')->constrained('users')->onDelete('cascade'); // کاربری که پیشنهاد داده
            $table->enum('source', ['auto', 'manual'])->default('auto'); // auto = سیستم، manual = فروشنده
            $table->float('relevance_score')->default(0.0); // امتیاز ارتباط
            $table->boolean('is_clicked')->default(false); // آیا خریدار کلیک کرده؟
            $table->boolean('is_purchased')->default(false); // آیا خریدار خریده؟
            $table->timestamps();

            $table->index(['conversation_id', 'product_id']);
            $table->index(['suggested_by', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_suggestions');
    }
};