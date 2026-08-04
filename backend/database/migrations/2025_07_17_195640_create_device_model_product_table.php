<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_model_product', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('device_model_id'); // ✅ این ستون حیاتی است
            $table->unsignedBigInteger('product_id');      // ✅ این ستون حیاتی است
            $table->timestamps();

            $table->foreign('device_model_id')->references('id')->on('device_models')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->unique(['device_model_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_model_product');
    }
};