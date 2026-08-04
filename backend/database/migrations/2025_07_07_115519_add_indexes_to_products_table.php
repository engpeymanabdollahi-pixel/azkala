<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // بررسی وجود index قبل از ایجاد (بدون نیاز به Doctrine)
            if (!Schema::hasIndex('products', 'products_is_featured_index')) {
                $table->index('is_featured');
            }
            
            if (!Schema::hasIndex('products', 'products_discount_price_index')) {
                $table->index('discount_price');
            }
            
            if (!Schema::hasIndex('products', 'products_sales_count_index')) {
                $table->index('sales_count');
            }
            
            if (!Schema::hasIndex('products', 'products_is_active_index')) {
                $table->index('is_active');
            }
            
            if (!Schema::hasIndex('products', 'products_is_active_is_featured_index')) {
                $table->index(['is_active', 'is_featured']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_featured']);
            $table->dropIndex(['discount_price']);
            $table->dropIndex(['sales_count']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['is_active', 'is_featured']);
        });
    }
};