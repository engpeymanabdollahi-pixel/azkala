<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_device_compatibility', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_model_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['product_id', 'device_model_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_device_compatibility');
    }
};