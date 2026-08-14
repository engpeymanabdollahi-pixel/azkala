<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * رفع «کلید خارجی دوگانه» روی device_series.brand_id در SQLite.
     *
     * ریشه: مهاجرت اولیه (create_device_series_table) با
     * $table->foreignId('brand_id')->constrained() نام جدول را از روی
     * قرارداد حدس زد و به‌جای device_brands به جدول قدیمی/خالیِ brands
     * وصل شد. مهاجرت بعدی (fix_device_series_brand_id_foreign_key) سعی کرد
     * این را با یک دستور خام مخصوص MySQL درست کند:
     *   ALTER TABLE device_series DROP FOREIGN KEY device_series_brand_id_foreign
     * روی MySQL این درست کار می‌کند، ولی SQLite اصلاً چنین syntax ای ندارد؛
     * چون آن مهاجرت این خطا را با try/catch خالی می‌بلعید، روی SQLite کلید
     * خارجی قدیمی هرگز حذف نشد و کلید خارجیِ درستِ بعدی (به device_brands)
     * کنارش اضافه شد — یعنی الان دو FK روی یک ستون: یکی به brands (که هیچ‌وقت
     * پر نمی‌شود) و یکی به device_brands (جدول واقعی). نتیجه: هر INSERT
     * جدید در device_series روی SQLite با «FOREIGN KEY constraint failed»
     * شکست می‌خورد — حتی با یک brand_id کاملاً معتبر — چون باید هم‌زمان در
     * brands (خالی) هم پیدا شود. این باعث می‌شود seed/reseed کامل دستگاه‌ها
     * روی هر دیتابیس SQLite (مثل محیط توسعه‌ی لوکال) غیرممکن شود.
     *
     * روی SQLite تنها راه حذف یک FK، بازسازی کامل جدول است (خود SQLite هم
     * همین را در مستنداتش توصیه می‌کند) — این مهاجرت این کار را فقط وقتی
     * انجام می‌دهد که واقعاً بیش از یک کلید خارجی روی brand_id تشخیص بدهد،
     * یعنی روی محیط‌هایی که مشکل ندارند (MySQL، یا SQLiteِ از قبل تمیز) کاملاً
     * بی‌اثر و امن است.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'sqlite' || !Schema::hasTable('device_series')) {
            return;
        }

        $brandIdForeignKeys = collect(Schema::getForeignKeys('device_series'))
            ->filter(fn ($fk) => in_array('brand_id', $fk['columns'], true));

        $hasDuplicateOrWrongFk = $brandIdForeignKeys->count() > 1
            || $brandIdForeignKeys->contains(fn ($fk) => $fk['foreign_table'] !== 'device_brands');

        if (!$hasDuplicateOrWrongFk) {
            return;
        }

        // ✅ عمداً بدون نام صریح برای ایندکس‌ها: روی یک نصب کاملاً تازه، در
        // همین لحظه جدول قدیمیِ device_series (و ایندکس‌های هم‌نامش —
        // device_series_slug_index و device_series_brand_id_index، که
        // مهاجرت add_performance_indexes_to_tables قبلاً ساخته) هنوز وجود
        // دارد. نام ایندکس در SQLite سراسریِ کل دیتابیس است، نه محدود به یک
        // جدول؛ نام‌گذاری زودهنگام همینجا با «index already exists» شکست
        // می‌خورد. به‌جایش می‌گذاریم Laravel با نام مبتنی‌بر جدول موقت
        // (device_series_rebuild_tmp_*_index) بسازد و بعد از drop/rename به
        // نام قراردادیِ نهایی تغییرشان می‌دهیم.
        Schema::create('device_series_rebuild_tmp', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained('device_brands')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index('slug');
            $table->index('brand_id');
        });

        DB::statement(
            'INSERT INTO device_series_rebuild_tmp '
            . '(id, brand_id, name, slug, is_active, created_at, updated_at, deleted_at) '
            . 'SELECT id, brand_id, name, slug, is_active, created_at, updated_at, deleted_at FROM device_series'
        );

        Schema::drop('device_series');
        Schema::rename('device_series_rebuild_tmp', 'device_series');

        // ✅ SQLite با RENAME TABLE نام ایندکس‌های خودکار را به‌روز نمی‌کند —
        // بدون این دو خط، بعد از rename نام ایندکس‌ها همچنان
        // device_series_rebuild_tmp_*_index می‌ماند و با چیزی که بقیه‌ی
        // مهاجرت‌ها/Schema::hasIndex بر اساس نام جدول واقعی انتظار دارند
        // مطابقت نخواهد داشت. حالا که جدول قدیمی drop شده، نام‌های نهایی آزادند.
        DB::statement('DROP INDEX IF EXISTS device_series_rebuild_tmp_slug_index');
        DB::statement('CREATE INDEX IF NOT EXISTS device_series_slug_index ON device_series (slug)');
        DB::statement('DROP INDEX IF EXISTS device_series_rebuild_tmp_brand_id_index');
        DB::statement('CREATE INDEX IF NOT EXISTS device_series_brand_id_index ON device_series (brand_id)');
    }

    /**
     * برگرداندن FK قدیمیِ خراب (اشاره به جدول خالی brands) فایده‌ای ندارد؛
     * این مهاجرت فقط یک ناهنجاری دیتا-اینتگریتی را رفع می‌کند، نه یک تغییر
     * رفتاری قابل toggle.
     */
    public function down(): void
    {
        // عمداً خالی — رجوع کنید به توضیح بالای up().
    }
};
