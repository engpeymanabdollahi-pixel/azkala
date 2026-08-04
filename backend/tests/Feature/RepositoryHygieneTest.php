<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * محافظ‌های بهداشت مخزن.
 *
 * هر دو موردی که اینجا تست می‌شوند واقعاً اتفاق افتاده‌اند و هیچ‌کدام با تست
 * معمولی گیر نمی‌افتند: هر دو وقتی خراب می‌شوند، کل سوییت همچنان سبز است.
 */
class RepositoryHygieneTest extends TestCase
{
    /**
     * نام مهاجرت‌ها نباید تغییر کند.
     *
     * جدول migrations نام فایل را ذخیره می‌کند. اگر یک مهاجرتِ قبلاً اجراشده
     * نامش عوض شود، لاراول آن را «اجرانشده» می‌بیند و دوباره اجرایش می‌کند:
     *
     *   SQLSTATE[HY000]: table "personal_access_tokens" already exists
     *
     * روی دیتابیس خالی (یعنی همین تست‌ها) هیچ مشکلی دیده نمی‌شود؛ فقط روی
     * دیتابیس واقعی می‌ترکد — یعنی روی لپ‌تاپ توسعه‌دهنده و روی تولید.
     *
     * افزودن مهاجرت جدید مجاز است؛ فقط تغییر نام یا حذف قبلی‌ها رد می‌شود.
     */
    public function test_no_existing_migration_has_been_renamed_or_removed(): void
    {
        $known = [
            '0001_01_01_000000_create_users_table',
            '0001_01_01_000001_create_cache_table',
            '0001_01_01_000002_create_jobs_table',
            '2026_06_19_062446_create_personal_access_tokens_table',
            '2026_06_19_062511_create_telescope_entries_table',
            '2026_06_19_062611_create_permission_tables',
            '2026_06_19_081756_create_categories_table',
            '2026_06_19_081757_create_brands_table',
            '2026_06_19_081817_create_phone_models_table',
            '2026_06_19_081827_create_products_table',
            '2026_06_19_081837_create_product_images_table',
            '2026_06_19_081847_create_product_phone_models_table',
            '2026_06_24_082602_create_carts_table',
            '2026_06_24_082613_create_cart_items_table',
            '2026_06_24_104812_create_orders_table',
            '2026_06_24_104815_create_order_items_table',
            '2026_06_24_132112_create_phone_series_table',
            '2026_06_24_132251_add_series_id_to_phone_models_table',
            '2026_06_26_073250_add_product_relation_to_order_items_table',
            '2026_06_26_172552_create_user_devices_table',
            '2026_06_26_180731_create_addresses_table',
            '2026_06_26_200508_create_reviews_table',
            '2026_06_27_170613_create_coupons_table',
            '2026_06_27_170614_add_coupon_fields_to_orders_table',
            '2026_06_28_194343_add_admin_reply_to_reviews_table',
            '2026_06_29_041410_add_seo_and_campaign_fields_to_categories_table',
            '2026_06_29_072113_add_advanced_fields_to_brands_table',
            '2026_06_29_073059_add_advanced_fields_to_brands_table',
            '2026_06_29_162247_create_settings_table',
            '2026_06_29_162249_create_setting_histories_table',
            '2026_06_29_174237_fix_settings_table_structure',
            '2026_06_30_082709_create_seller_ratings_table',
            '2026_06_30_195955_create_wishlists_table',
            '2026_07_01_131021_create_conversations_table',
            '2026_07_01_131022_create_messages_table',
            '2026_07_01_150331_add_compare_price_to_products_table',
            '2026_07_01_153031_create_seller_quick_replies_table',
            '2026_07_01_190256_create_blocked_users_table',
            '2026_07_01_190432_create_chat_reports_table',
            '2026_07_01_202822_create_chat_faq_table',
            '2026_07_02_185306_create_message_sentiments_table',
            '2026_07_04_153950_create_product_suggestions_table',
            '2026_07_07_053226_create_message_templates_table',
            '2026_07_07_061225_create_support_tickets_table',
            '2026_07_07_061226_create_ticket_messages_table',
            '2026_07_07_213852_create_push_subscriptions_table',
            '2026_07_08_115519_add_indexes_to_products_table',
            '2026_07_13_141413_create_seller_transactions_table',
            '2026_07_13_141746_add_seller_commission_rate_to_users_table',
            '2026_07_13_142144_add_wallet_balance_to_users_table',
            '2026_07_14_200624_add_commission_deducted_to_seller_transactions_table',
            '2026_07_14_204815_ensure_seller_requests_columns',
            '2026_07_16_095150_create_device_brands_table',
            '2026_07_16_095151_create_device_series_table',
            '2026_07_16_095152_create_device_models_table',
            '2026_07_16_133950_add_performance_indexes_to_tables',
            '2026_07_18_110808_add_review_fields_to_seller_requests_table',
            '2026_07_18_132710_add_is_active_to_device_tables',
            '2026_07_18_134058_add_device_model_id_to_products_table',
            '2026_07_18_195640_create_device_model_product_table',
            '2026_07_19_135055_add_missing_columns_to_seller_requests_table',
            '2026_07_19_142841_add_image_column_to_device_models_table',
            '2026_07_19_160403_add_device_model_id_to_cart_items_table',
            '2026_07_19_162024_add_device_model_id_to_cart_items_table',
            '2026_07_22_132132_change_price_columns_to_decimal',
            '2026_07_22_143526_fix_price_columns_to_decimal_raw',
            '2026_07_24_061703_add_documents_and_statuses_to_seller_requests_table',
            '2026_07_24_075857_create_notifications_table',
            '2026_07_24_121143_add_storefront_fields_to_users_table',
            '2026_07_24_121145_create_seller_follows_table',
            '2026_07_24_142751_add_slug_to_users_table',
            '2026_07_28_100130_create_product_device_compatibility_table',
            '2026_07_29_134847_add_type_to_device_brands_table',
            '2026_07_29_170101_make_email_nullable_in_users_table',
            '2026_07_29_191757_fix_device_series_brand_id_foreign_key',
            '2026_07_30_043823_change_specifications_to_json_in_products_table',
            '2026_08_02_074619_create_product_histories_table',
            '2026_08_03_120000_add_soft_deletes_to_addresses_table',
            '2026_08_03_120100_add_soft_deletes_to_seller_requests_table',
            '2026_08_03_120200_add_soft_deletes_to_reviews_table',
            '2026_08_03_120300_add_soft_deletes_to_brands_table',
            '2026_08_03_120400_add_soft_deletes_to_categories_table',
            '2026_08_03_120500_add_soft_deletes_to_device_brands_table',
            '2026_08_03_120600_add_soft_deletes_to_device_series_table',
            '2026_08_03_120700_add_soft_deletes_to_device_models_table',
            '2026_08_03_120800_add_soft_deletes_to_users_table',
            '2026_08_03_130000_add_missing_columns_to_support_tickets_table',
        ];

        $present = collect(glob(database_path('migrations/*.php')))
            ->map(fn (string $path) => basename($path, '.php'))
            ->all();

        $missing = array_values(array_diff($known, $present));

        $this->assertSame([], $missing, sprintf(
            "این مهاجرت‌ها دیگر با نام قبلی وجود ندارند:\n  %s\n\n"
            . "اگر واقعاً تغییر نام داده‌اید، روی هر دیتابیسی که قبلاً migrate شده "
            . "دوباره اجرا می‌شوند و با «table already exists» شکست می‌خورند.",
            implode("\n  ", $missing)
        ));
    }

    /**
     * .gitignore باید ورودی‌های حیاتی را داشته باشد.
     *
     * این فایل سه بار در جریان کار روی همین پروژه خالی یا بازنویسی شد. هر بار
     * نتیجه‌اش این بود که `git add -A` بعدی می‌توانست backend/.env — با رمز
     * دیتابیس و کلید اپلیکیشن — را وارد تاریخچه کند.
     */
    public function test_gitignore_still_ignores_secrets_and_dependencies(): void
    {
        $path = base_path('../.gitignore');

        $this->assertFileExists($path, '.gitignore حذف شده است');

        $contents = file_get_contents($path);

        foreach (['vendor/', 'node_modules/', '.env', 'backend/.env'] as $entry) {
            $this->assertStringContainsString($entry, $contents, sprintf(
                '.gitignore دیگر «%s» را نادیده نمی‌گیرد', $entry
            ));
        }
    }
}
