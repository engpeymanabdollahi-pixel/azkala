<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('product_quality')->default(5);
            $table->tinyInteger('shipping_speed')->default(5);
            $table->tinyInteger('communication')->default(5);
            $table->decimal('overall_rating', 2, 1)->default(5.0);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'order_id']);
            $table->index(['seller_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_ratings');
    }
};