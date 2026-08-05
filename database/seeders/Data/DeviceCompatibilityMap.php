<?php

namespace Database\Seeders\Data;

/**
 * Device Compatibility Map - 30+ Popular Phone Models
 */
class DeviceCompatibilityMap
{
    /**
     * Get all devices for seeding
     * 
     * @return array
     */
    public static function getDevices(): array
    {
        return [
            // Apple iPhone (Latest)
            [
                'name' => 'iPhone 16 Pro Max',
                'slug' => 'iphone-16-pro-max',
                'brand' => 'apple',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'iPhone 16 Pro',
                'slug' => 'iphone-16-pro',
                'brand' => 'apple',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'iPhone 16',
                'slug' => 'iphone-16',
                'brand' => 'apple',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'iPhone 15 Pro Max',
                'slug' => 'iphone-15-pro-max',
                'brand' => 'apple',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'iPhone 15 Pro',
                'slug' => 'iphone-15-pro',
                'brand' => 'apple',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'iPhone 15',
                'slug' => 'iphone-15',
                'brand' => 'apple',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'iPhone 14 Pro Max',
                'slug' => 'iphone-14-pro-max',
                'brand' => 'apple',
                'connector_type' => 'Lightning',
                'release_year' => 2022,
            ],
            [
                'name' => 'iPhone 14 Pro',
                'slug' => 'iphone-14-pro',
                'brand' => 'apple',
                'connector_type' => 'Lightning',
                'release_year' => 2022,
            ],
            [
                'name' => 'iPhone 14',
                'slug' => 'iphone-14',
                'brand' => 'apple',
                'connector_type' => 'Lightning',
                'release_year' => 2022,
            ],
            [
                'name' => 'iPhone 13 Pro Max',
                'slug' => 'iphone-13-pro-max',
                'brand' => 'apple',
                'connector_type' => 'Lightning',
                'release_year' => 2021,
            ],
            [
                'name' => 'iPhone 13',
                'slug' => 'iphone-13',
                'brand' => 'apple',
                'connector_type' => 'Lightning',
                'release_year' => 2021,
            ],
            // Samsung Galaxy S Series
            [
                'name' => 'Galaxy S24 Ultra',
                'slug' => 'galaxy-s24-ultra',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'Galaxy S24+',
                'slug' => 'galaxy-s24-plus',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'Galaxy S24',
                'slug' => 'galaxy-s24',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'Galaxy S23 Ultra',
                'slug' => 'galaxy-s23-ultra',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'Galaxy S23+',
                'slug' => 'galaxy-s23-plus',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'Galaxy S23',
                'slug' => 'galaxy-s23',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'Galaxy S22 Ultra',
                'slug' => 'galaxy-s22-ultra',
                'brand' => 'samsung',
                'connector_type' => 'USB-C',
                'release_year' => 2022,
            ],
            // Xiaomi Flagships
            [
                'name' => 'Xiaomi 14 Ultra',
                'slug' => 'xiaomi-14-ultra',
                'brand' => 'xiaomi',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'Xiaomi 14',
                'slug' => 'xiaomi-14',
                'brand' => 'xiaomi',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'Xiaomi 13 Ultra',
                'slug' => 'xiaomi-13-ultra',
                'brand' => 'xiaomi',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'Xiaomi 13 Pro',
                'slug' => 'xiaomi-13-pro',
                'brand' => 'xiaomi',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'Redmi Note 13 Pro+',
                'slug' => 'redmi-note-13-pro-plus',
                'brand' => 'xiaomi',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'POCO X6 Pro',
                'slug' => 'poco-x6-pro',
                'brand' => 'xiaomi',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            // Other Brands
            [
                'name' => 'Google Pixel 8 Pro',
                'slug' => 'pixel-8-pro',
                'brand' => 'google',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
            [
                'name' => 'OnePlus 12',
                'slug' => 'oneplus-12',
                'brand' => 'oneplus',
                'connector_type' => 'USB-C',
                'release_year' => 2024,
            ],
            [
                'name' => 'Nothing Phone (2)',
                'slug' => 'nothing-phone-2',
                'brand' => 'nothing',
                'connector_type' => 'USB-C',
                'release_year' => 2023,
            ],
        ];
    }

    /**
     * Compatibility rules for accessories
     * 
     * @return array
     */
    public static function getCompatibilityRules(): array
    {
        return [
            // Lightning connectors work with older iPhones
            [
                'accessory_type' => 'cable-lightning',
                'compatible_connectors' => ['Lightning'],
                'description' => 'کابل‌های لایتنینگ فقط برای آیفون‌های قدیمی (قبل از سری 15)',
            ],
            // USB-C works with newer devices
            [
                'accessory_type' => 'cable-usbc',
                'compatible_connectors' => ['USB-C'],
                'description' => 'کابل‌های تایپ سی برای دستگاه‌های جدید آیفون 15 به بالا و اکثر اندرویدی‌ها',
            ],
            // MagSafe for iPhone 12 and newer
            [
                'accessory_type' => 'magsafe',
                'compatible_models_pattern' => 'iphone-1*',
                'description' => 'MagSafe برای آیفون 12 و مدل‌های جدیدتر',
            ],
        ];
    }
}
