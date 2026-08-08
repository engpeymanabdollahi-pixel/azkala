<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['restock', 'price_drop', 'target_price']);
            $table->decimal('target_price', 12, 2)->nullable(); // for target_price type only
            $table->decimal('original_price', 12, 2); // price when alert created
            $table->boolean('is_active')->default(true);
            $table->boolean('is_triggered')->default(false);
            $table->timestamp('triggered_at')->nullable();
            $table->json('channels')->default('["database","email"]');
            $table->timestamps();

            // Indexes for performance
            $table->unique(['user_id', 'product_id', 'type'], 'user_product_type_unique');
            $table->index(['is_active', 'type', 'is_triggered'], 'alert_processing_index');
            $table->index('product_id', 'product_alerts_product_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_alerts');
    }
};
