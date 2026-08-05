<?php

namespace Database\Data;

/**
 * نگاشت دستگاه‌ها و قوانین سازگاری (Device Compatibility Map)
 * شامل ۳۰ مدل گوشی پرطرفدار و قوانین سازگاری لوازم جانبی
 */
class DeviceCompatibilityMap
{
    /**
     * لیست دستگاه‌های پرطرفدار
     * 
     * @return array
     */
    public static function getDevices(): array
    {
        return [
            // Apple iPhone Series
            [
                'name' => 'iPhone 16 Pro Max',
                'slug' => 'iphone-16-pro-max',
                'brand_slug' => 'apple',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.9"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c', 'usb-c-to-lightning'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['iphone-16-pro-max'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 16 Pro',
                'slug' => 'iphone-16-pro',
                'brand_slug' => 'apple',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.3"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c', 'usb-c-to-lightning'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['iphone-16-pro'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 15 Pro Max',
                'slug' => 'iphone-15-pro-max',
                'brand_slug' => 'apple',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['iphone-15-pro-max'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 15 Pro',
                'slug' => 'iphone-15-pro',
                'brand_slug' => 'apple',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.1"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['iphone-15-pro'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 14 Pro Max',
                'slug' => 'iphone-14-pro-max',
                'brand_slug' => 'apple',
                'release_year' => 2022,
                'connector_type' => 'Lightning',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['lightning-to-usb-a', 'lightning-to-usb-c'],
                    'charger_type' => ['usb-a', 'usb-c-pd'],
                    'case_compatible_with' => ['iphone-14-pro-max'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 14 Pro',
                'slug' => 'iphone-14-pro',
                'brand_slug' => 'apple',
                'release_year' => 2022,
                'connector_type' => 'Lightning',
                'screen_size' => '6.1"',
                'compatibility_rules' => [
                    'cable_type' => ['lightning-to-usb-a', 'lightning-to-usb-c'],
                    'charger_type' => ['usb-a', 'usb-c-pd'],
                    'case_compatible_with' => ['iphone-14-pro'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 13 Pro Max',
                'slug' => 'iphone-13-pro-max',
                'brand_slug' => 'apple',
                'release_year' => 2021,
                'connector_type' => 'Lightning',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['lightning-to-usb-a', 'lightning-to-usb-c'],
                    'charger_type' => ['usb-a', 'usb-c-pd'],
                    'case_compatible_with' => ['iphone-13-pro-max'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],
            [
                'name' => 'iPhone 13',
                'slug' => 'iphone-13',
                'brand_slug' => 'apple',
                'release_year' => 2021,
                'connector_type' => 'Lightning',
                'screen_size' => '6.1"',
                'compatibility_rules' => [
                    'cable_type' => ['lightning-to-usb-a', 'lightning-to-usb-c'],
                    'charger_type' => ['usb-a', 'usb-c-pd'],
                    'case_compatible_with' => ['iphone-13'],
                    'wireless_charging' => true,
                    'magsafe_compatible' => true,
                ],
            ],

            // Samsung Galaxy S Series
            [
                'name' => 'Samsung Galaxy S24 Ultra',
                'slug' => 'samsung-galaxy-s24-ultra',
                'brand_slug' => 'samsung',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.8"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'samsung-super-fast-charging'],
                    'case_compatible_with' => ['samsung-galaxy-s24-ultra'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Samsung Galaxy S24+',
                'slug' => 'samsung-galaxy-s24-plus',
                'brand_slug' => 'samsung',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'samsung-super-fast-charging'],
                    'case_compatible_with' => ['samsung-galaxy-s24-plus'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Samsung Galaxy S24',
                'slug' => 'samsung-galaxy-s24',
                'brand_slug' => 'samsung',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.2"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'samsung-super-fast-charging'],
                    'case_compatible_with' => ['samsung-galaxy-s24'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Samsung Galaxy S23 Ultra',
                'slug' => 'samsung-galaxy-s23-ultra',
                'brand_slug' => 'samsung',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.8"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'samsung-super-fast-charging'],
                    'case_compatible_with' => ['samsung-galaxy-s23-ultra'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Samsung Galaxy S23+',
                'slug' => 'samsung-galaxy-s23-plus',
                'brand_slug' => 'samsung',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.6"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'samsung-super-fast-charging'],
                    'case_compatible_with' => ['samsung-galaxy-s23-plus'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Samsung Galaxy S23',
                'slug' => 'samsung-galaxy-s23',
                'brand_slug' => 'samsung',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.1"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'samsung-super-fast-charging'],
                    'case_compatible_with' => ['samsung-galaxy-s23'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],

            // Xiaomi Flagship Series
            [
                'name' => 'Xiaomi 14 Ultra',
                'slug' => 'xiaomi-14-ultra',
                'brand_slug' => 'xiaomi',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.73"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'xiaomi-hypercharge'],
                    'case_compatible_with' => ['xiaomi-14-ultra'],
                    'wireless_charging' => true,
                    'reverse_wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Xiaomi 14 Pro',
                'slug' => 'xiaomi-14-pro',
                'brand_slug' => 'xiaomi',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.73"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'xiaomi-hypercharge'],
                    'case_compatible_with' => ['xiaomi-14-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Xiaomi 13 Pro',
                'slug' => 'xiaomi-13-pro',
                'brand_slug' => 'xiaomi',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.73"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'xiaomi-hypercharge'],
                    'case_compatible_with' => ['xiaomi-13-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Xiaomi 13 Lite',
                'slug' => 'xiaomi-13-lite',
                'brand_slug' => 'xiaomi',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.55"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['xiaomi-13-lite'],
                    'wireless_charging' => false,
                ],
            ],

            // Other Popular Devices
            [
                'name' => 'Google Pixel 8 Pro',
                'slug' => 'google-pixel-8-pro',
                'brand_slug' => 'google',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['google-pixel-8-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Google Pixel 8',
                'slug' => 'google-pixel-8',
                'brand_slug' => 'google',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.2"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['google-pixel-8'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'OnePlus 12',
                'slug' => 'oneplus-12',
                'brand_slug' => 'oneplus',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.82"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'oneplus-warp-charge'],
                    'case_compatible_with' => ['oneplus-12'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'OnePlus 11',
                'slug' => 'oneplus-11',
                'brand_slug' => 'oneplus',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'oneplus-warp-charge'],
                    'case_compatible_with' => ['oneplus-11'],
                    'wireless_charging' => false,
                ],
            ],
            [
                'name' => 'Nothing Phone (2)',
                'slug' => 'nothing-phone-2',
                'brand_slug' => 'nothing',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.7"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['nothing-phone-2'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Nothing Phone (1)',
                'slug' => 'nothing-phone-1',
                'brand_slug' => 'nothing',
                'release_year' => 2022,
                'connector_type' => 'USB-C',
                'screen_size' => '6.55"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['nothing-phone-1'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Huawei P60 Pro',
                'slug' => 'huawei-p60-pro',
                'brand_slug' => 'huawei',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.67"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'huawei-supercharge'],
                    'case_compatible_with' => ['huawei-p60-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Oppo Find X6 Pro',
                'slug' => 'oppo-find-x6-pro',
                'brand_slug' => 'oppo',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.82"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'oppo-super-vooc'],
                    'case_compatible_with' => ['oppo-find-x6-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Vivo X100 Pro',
                'slug' => 'vivo-x100-pro',
                'brand_slug' => 'vivo',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.78"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'vivo-flashcharge'],
                    'case_compatible_with' => ['vivo-x100-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Realme GT 5 Pro',
                'slug' => 'realme-gt-5-pro',
                'brand_slug' => 'realme',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.78"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'realme-superdart'],
                    'case_compatible_with' => ['realme-gt-5-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Honor Magic 6 Pro',
                'slug' => 'honor-magic-6-pro',
                'brand_slug' => 'honor',
                'release_year' => 2024,
                'connector_type' => 'USB-C',
                'screen_size' => '6.8"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd', 'honor-supercharge'],
                    'case_compatible_with' => ['honor-magic-6-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Motorola Edge 40 Pro',
                'slug' => 'motorola-edge-40-pro',
                'brand_slug' => 'motorola',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.67"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['motorola-edge-40-pro'],
                    'wireless_charging' => true,
                ],
            ],
            [
                'name' => 'Sony Xperia 1 V',
                'slug' => 'sony-xperia-1-v',
                'brand_slug' => 'sony',
                'release_year' => 2023,
                'connector_type' => 'USB-C',
                'screen_size' => '6.5"',
                'compatibility_rules' => [
                    'cable_type' => ['usb-c-to-usb-c'],
                    'charger_type' => ['usb-c-pd'],
                    'case_compatible_with' => ['sony-xperia-1-v'],
                    'wireless_charging' => true,
                ],
            ],
        ];
    }

    /**
     * دریافت تعداد کل دستگاه‌ها
     * 
     * @return int
     */
    public static function getCount(): int
    {
        return count(self::getDevices());
    }

    /**
     * جستجوی دستگاه بر اساس اسلاگ
     * 
     * @param string $slug
     * @return array|null
     */
    public static function findBySlug(string $slug): ?array
    {
        $devices = self::getDevices();
        foreach ($devices as $device) {
            if ($device['slug'] === $slug) {
                return $device;
            }
        }
        return null;
    }

    /**
     * دریافت دستگاه‌هایcompatible با نوع کابل خاص
     * 
     * @param string $cableType
     * @return array
     */
    public static function getByCableType(string $cableType): array
    {
        return array_filter(self::getDevices(), function ($device) use ($cableType) {
            return in_array($cableType, $device['compatibility_rules']['cable_type']);
        });
    }

    /**
     * دریافت دستگاه‌های پشتیبانی‌کننده از شارژ وایرلس
     * 
     * @return array
     */
    public static function getWithWirelessCharging(): array
    {
        return array_filter(self::getDevices(), function ($device) {
            return $device['compatibility_rules']['wireless_charging'] === true;
        });
    }
}
