<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * تغییر نوع ستون‌های مالی به DECIMAL با استفاده از Raw SQL
     * (این روش مستقیماً با MySQL صحبت می‌کند و نیازی به doctrine/dbal ندارد)
     */
    public function up(): void
    {
        // 1. جدول محصولات
        DB::statement('ALTER TABLE products MODIFY COLUMN price DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
        DB::statement('ALTER TABLE products MODIFY COLUMN compare_price DECIMAL(15,4) NULL');
        DB::statement('ALTER TABLE products MODIFY COLUMN discount_price DECIMAL(15,4) NULL');

        // 2. جدول آیتم‌های سفارش
        DB::statement('ALTER TABLE order_items MODIFY COLUMN price DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
        DB::statement('ALTER TABLE order_items MODIFY COLUMN total DECIMAL(15,4) NOT NULL DEFAULT 0.0000');

        // 3. جدول سفارشات
        DB::statement('ALTER TABLE orders MODIFY COLUMN subtotal DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
        DB::statement('ALTER TABLE orders MODIFY COLUMN tax DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
        DB::statement('ALTER TABLE orders MODIFY COLUMN shipping DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
        DB::statement('ALTER TABLE orders MODIFY COLUMN discount DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
        DB::statement('ALTER TABLE orders MODIFY COLUMN total DECIMAL(15,4) NOT NULL DEFAULT 0.0000');
    }

    /**
     * بازگشت به حالت قبلی (Float)
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE products MODIFY COLUMN price FLOAT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE products MODIFY COLUMN compare_price FLOAT NULL');
        DB::statement('ALTER TABLE products MODIFY COLUMN discount_price FLOAT NULL');

        DB::statement('ALTER TABLE order_items MODIFY COLUMN price FLOAT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE order_items MODIFY COLUMN total FLOAT NOT NULL DEFAULT 0');

        DB::statement('ALTER TABLE orders MODIFY COLUMN subtotal FLOAT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE orders MODIFY COLUMN tax FLOAT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE orders MODIFY COLUMN shipping FLOAT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE orders MODIFY COLUMN discount FLOAT NOT NULL DEFAULT 0');
        DB::statement('ALTER TABLE orders MODIFY COLUMN total FLOAT NOT NULL DEFAULT 0');
    }
};