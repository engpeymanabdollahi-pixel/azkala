<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ایندکس‌های جدول products (با بررسی تکراری نبودن)
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'slug') && !Schema::hasIndex('products', 'products_slug_index')) {
                $table->index('slug');
            }
            
            if (Schema::hasColumn('products', 'category_id') && !Schema::hasIndex('products', 'products_category_id_index')) {
                $table->index('category_id');
            }
            
            if (Schema::hasColumn('products', 'seller_id') && !Schema::hasIndex('products', 'products_seller_id_index')) {
                $table->index('seller_id');
            }
            
            if (!Schema::hasIndex('products', 'products_is_active_index')) {
                $table->index('is_active');
            }
            
            if (!Schema::hasIndex('products', 'products_price_index')) {
                $table->index('price');
            }
            
            if (!Schema::hasIndex('products', 'products_created_at_index')) {
                $table->index('created_at');
            }
        });

        // ایندکس‌های جدول categories
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'slug') && !Schema::hasIndex('categories', 'categories_slug_index')) {
                $table->index('slug');
            }
            if (!Schema::hasIndex('categories', 'categories_is_active_index')) {
                $table->index('is_active');
            }
        });

        // ایندکس‌های جدول device_brands
        if (Schema::hasTable('device_brands')) {
            Schema::table('device_brands', function (Blueprint $table) {
                if (!Schema::hasIndex('device_brands', 'device_brands_slug_index')) {
                    $table->index('slug');
                }
            });
        }

        // ایندکس‌های جدول device_series
        if (Schema::hasTable('device_series')) {
            Schema::table('device_series', function (Blueprint $table) {
                if (!Schema::hasIndex('device_series', 'device_series_slug_index')) {
                    $table->index('slug');
                }
                if (!Schema::hasIndex('device_series', 'device_series_brand_id_index')) {
                    $table->index('brand_id');
                }
            });
        }

        // ایندکس‌های جدول device_models
        if (Schema::hasTable('device_models')) {
            Schema::table('device_models', function (Blueprint $table) {
                if (!Schema::hasIndex('device_models', 'device_models_slug_index')) {
                    $table->index('slug');
                }
                if (!Schema::hasIndex('device_models', 'device_models_series_id_index')) {
                    $table->index('series_id');
                }
            });
        }

        // ایندکس‌های جدول product_device_compatibility
        if (Schema::hasTable('product_device_compatibility')) {
            Schema::table('product_device_compatibility', function (Blueprint $table) {
                if (!Schema::hasIndex('product_device_compatibility', 'product_device_compatibility_product_id_index')) {
                    $table->index('product_id');
                }
                if (!Schema::hasIndex('product_device_compatibility', 'product_device_compatibility_device_model_id_index')) {
                    $table->index('device_model_id');
                }
            });
        }

        // ایندکس‌های جدول order_items
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasIndex('order_items', 'order_items_order_id_index')) {
                $table->index('order_id');
            }
            if (!Schema::hasIndex('order_items', 'order_items_product_id_index')) {
                $table->index('product_id');
            }
            if (!Schema::hasIndex('order_items', 'order_items_seller_id_index')) {
                $table->index('seller_id');
            }
        });

        // ایندکس‌های جدول carts
        Schema::table('carts', function (Blueprint $table) {
            if (!Schema::hasIndex('carts', 'carts_user_id_index')) {
                $table->index('user_id');
            }
        });

        // ایندکس‌های جدول cart_items
        Schema::table('cart_items', function (Blueprint $table) {
            if (!Schema::hasIndex('cart_items', 'cart_items_cart_id_index')) {
                $table->index('cart_id');
            }
            if (!Schema::hasIndex('cart_items', 'cart_items_product_id_index')) {
                $table->index('product_id');
            }
        });
    }

    public function down(): void
    {
        // حذف ایندکس‌ها در صورت rollback (با بررسی وجود)
        Schema::table('products', function (Blueprint $table) {
            $indexes = ['slug', 'category_id', 'seller_id', 'is_active', 'price', 'created_at'];
            foreach ($indexes as $index) {
                if (Schema::hasIndex('products', "products_{$index}_index")) {
                    $table->dropIndex("products_{$index}_index");
                }
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasIndex('categories', 'categories_slug_index')) {
                $table->dropIndex('categories_slug_index');
            }
            if (Schema::hasIndex('categories', 'categories_is_active_index')) {
                $table->dropIndex('categories_is_active_index');
            }
        });

        if (Schema::hasTable('device_brands')) {
            Schema::table('device_brands', function (Blueprint $table) {
                if (Schema::hasIndex('device_brands', 'device_brands_slug_index')) {
                    $table->dropIndex('device_brands_slug_index');
                }
            });
        }

        if (Schema::hasTable('device_series')) {
            Schema::table('device_series', function (Blueprint $table) {
                if (Schema::hasIndex('device_series', 'device_series_slug_index')) {
                    $table->dropIndex('device_series_slug_index');
                }
                if (Schema::hasIndex('device_series', 'device_series_brand_id_index')) {
                    $table->dropIndex('device_series_brand_id_index');
                }
            });
        }

        if (Schema::hasTable('device_models')) {
            Schema::table('device_models', function (Blueprint $table) {
                if (Schema::hasIndex('device_models', 'device_models_slug_index')) {
                    $table->dropIndex('device_models_slug_index');
                }
                if (Schema::hasIndex('device_models', 'device_models_series_id_index')) {
                    $table->dropIndex('device_models_series_id_index');
                }
            });
        }

        if (Schema::hasTable('product_device_compatibility')) {
            Schema::table('product_device_compatibility', function (Blueprint $table) {
                if (Schema::hasIndex('product_device_compatibility', 'product_device_compatibility_product_id_index')) {
                    $table->dropIndex('product_device_compatibility_product_id_index');
                }
                if (Schema::hasIndex('product_device_compatibility', 'product_device_compatibility_device_model_id_index')) {
                    $table->dropIndex('product_device_compatibility_device_model_id_index');
                }
            });
        }

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasIndex('order_items', 'order_items_order_id_index')) {
                $table->dropIndex('order_items_order_id_index');
            }
            if (Schema::hasIndex('order_items', 'order_items_product_id_index')) {
                $table->dropIndex('order_items_product_id_index');
            }
            if (Schema::hasIndex('order_items', 'order_items_seller_id_index')) {
                $table->dropIndex('order_items_seller_id_index');
            }
        });

        Schema::table('carts', function (Blueprint $table) {
            if (Schema::hasIndex('carts', 'carts_user_id_index')) {
                $table->dropIndex('carts_user_id_index');
            }
        });

        Schema::table('cart_items', function (Blueprint $table) {
            if (Schema::hasIndex('cart_items', 'cart_items_cart_id_index')) {
                $table->dropIndex('cart_items_cart_id_index');
            }
            if (Schema::hasIndex('cart_items', 'cart_items_product_id_index')) {
                $table->dropIndex('cart_items_product_id_index');
            }
        });
    }
};