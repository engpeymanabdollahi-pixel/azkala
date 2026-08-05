<?php

/**
 * Azkala Backend Team - Phase 2: Content Engineering
 * File: database/data/DeviceCompatibilityMap.php
 * Description: List of 30+ popular devices and their compatibility rules.
 */

return [
    // ------------------------------------------------------------------
    // Apple iPhones (Lightning & USB-C)
    // ------------------------------------------------------------------
    [
        'name' => 'iPhone 16 Pro Max',
        'slug' => 'iphone-16-pro-max',
        'brand' => 'Apple',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.9 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-C to Lightning'],
            'charger_type' => ['PD Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 16 Pro Max Only'],
            'screen_protector' => ['iPhone 16 Pro Max Only']
        ],
    ],
    [
        'name' => 'iPhone 16 Pro',
        'slug' => 'iphone-16-pro',
        'brand' => 'Apple',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.3 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-C to Lightning'],
            'charger_type' => ['PD Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 16 Pro Only'],
            'screen_protector' => ['iPhone 16 Pro Only']
        ],
    ],
    [
        'name' => 'iPhone 15 Pro Max',
        'slug' => 'iphone-15-pro-max',
        'brand' => 'Apple',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.7 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-C to Lightning'],
            'charger_type' => ['PD Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 15 Pro Max Only'],
            'screen_protector' => ['iPhone 15 Pro Max Only']
        ],
    ],
    [
        'name' => 'iPhone 15 Pro',
        'slug' => 'iphone-15-pro',
        'brand' => 'Apple',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-C to Lightning'],
            'charger_type' => ['PD Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 15 Pro Only'],
            'screen_protector' => ['iPhone 15 Pro Only']
        ],
    ],
    [
        'name' => 'iPhone 15',
        'slug' => 'iphone-15',
        'brand' => 'Apple',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-C to Lightning'],
            'charger_type' => ['PD Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 15 Only'],
            'screen_protector' => ['iPhone 15 Only']
        ],
    ],
    [
        'name' => 'iPhone 14 Pro Max',
        'slug' => 'iphone-14-pro-max',
        'brand' => 'Apple',
        'release_year' => 2022,
        'port_type' => 'Lightning',
        'screen_size' => '6.7 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-A to Lightning', 'USB-C to Lightning'],
            'charger_type' => ['Standard Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 14 Pro Max Only'],
            'screen_protector' => ['iPhone 14 Pro Max Only']
        ],
    ],
    [
        'name' => 'iPhone 14 Pro',
        'slug' => 'iphone-14-pro',
        'brand' => 'Apple',
        'release_year' => 2022,
        'port_type' => 'Lightning',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-A to Lightning', 'USB-C to Lightning'],
            'charger_type' => ['Standard Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 14 Pro Only'],
            'screen_protector' => ['iPhone 14 Pro Only']
        ],
    ],
    [
        'name' => 'iPhone 14',
        'slug' => 'iphone-14',
        'brand' => 'Apple',
        'release_year' => 2022,
        'port_type' => 'Lightning',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-A to Lightning', 'USB-C to Lightning'],
            'charger_type' => ['Standard Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 14 Only', 'iPhone 13 Only'],
            'screen_protector' => ['iPhone 14 Only', 'iPhone 13 Only']
        ],
    ],
    [
        'name' => 'iPhone 13 Pro Max',
        'slug' => 'iphone-13-pro-max',
        'brand' => 'Apple',
        'release_year' => 2021,
        'port_type' => 'Lightning',
        'screen_size' => '6.7 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-A to Lightning', 'USB-C to Lightning'],
            'charger_type' => ['Standard Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 13 Pro Max Only'],
            'screen_protector' => ['iPhone 13 Pro Max Only']
        ],
    ],
    [
        'name' => 'iPhone 13',
        'slug' => 'iphone-13',
        'brand' => 'Apple',
        'release_year' => 2021,
        'port_type' => 'Lightning',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-A to Lightning', 'USB-C to Lightning'],
            'charger_type' => ['Standard Charger', 'MagSafe Wireless'],
            'case_compatibility' => ['iPhone 13 Only', 'iPhone 14 Only'],
            'screen_protector' => ['iPhone 13 Only', 'iPhone 14 Only']
        ],
    ],

    // ------------------------------------------------------------------
    // Samsung Galaxy S Series (USB-C)
    // ------------------------------------------------------------------
    [
        'name' => 'Samsung Galaxy S24 Ultra',
        'slug' => 'samsung-s24-ultra',
        'brand' => 'Samsung',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.8 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S24 Ultra Only'],
            'screen_protector' => ['S24 Ultra Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S24+',
        'slug' => 'samsung-s24-plus',
        'brand' => 'Samsung',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.7 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S24+ Only'],
            'screen_protector' => ['S24+ Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S24',
        'slug' => 'samsung-s24',
        'brand' => 'Samsung',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.2 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S24 Only'],
            'screen_protector' => ['S24 Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S23 Ultra',
        'slug' => 'samsung-s23-ultra',
        'brand' => 'Samsung',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.8 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S23 Ultra Only'],
            'screen_protector' => ['S23 Ultra Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S23+',
        'slug' => 'samsung-s23-plus',
        'brand' => 'Samsung',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.6 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S23+ Only'],
            'screen_protector' => ['S23+ Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S23',
        'slug' => 'samsung-s23',
        'brand' => 'Samsung',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S23 Only'],
            'screen_protector' => ['S23 Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S22 Ultra',
        'slug' => 'samsung-s22-ultra',
        'brand' => 'Samsung',
        'release_year' => 2022,
        'port_type' => 'USB-C',
        'screen_size' => '6.8 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S22 Ultra Only'],
            'screen_protector' => ['S22 Ultra Only']
        ],
    ],
    [
        'name' => 'Samsung Galaxy S22',
        'slug' => 'samsung-s22',
        'brand' => 'Samsung',
        'release_year' => 2022,
        'port_type' => 'USB-C',
        'screen_size' => '6.1 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['S22 Only'],
            'screen_protector' => ['S22 Only']
        ],
    ],

    // ------------------------------------------------------------------
    // Xiaomi Flagships (USB-C)
    // ------------------------------------------------------------------
    [
        'name' => 'Xiaomi 14 Ultra',
        'slug' => 'xiaomi-14-ultra',
        'brand' => 'Xiaomi',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.73 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Mi Wireless'],
            'case_compatibility' => ['Xiaomi 14 Ultra Only'],
            'screen_protector' => ['Xiaomi 14 Ultra Only']
        ],
    ],
    [
        'name' => 'Xiaomi 14',
        'slug' => 'xiaomi-14',
        'brand' => 'Xiaomi',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.36 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Mi Wireless'],
            'case_compatibility' => ['Xiaomi 14 Only'],
            'screen_protector' => ['Xiaomi 14 Only']
        ],
    ],
    [
        'name' => 'Xiaomi 13T Pro',
        'slug' => 'xiaomi-13t-pro',
        'brand' => 'Xiaomi',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.67 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Mi Wireless'],
            'case_compatibility' => ['Xiaomi 13T Pro Only'],
            'screen_protector' => ['Xiaomi 13T Pro Only']
        ],
    ],
    [
        'name' => 'Xiaomi 13 Pro',
        'slug' => 'xiaomi-13-pro',
        'brand' => 'Xiaomi',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.73 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Mi Wireless'],
            'case_compatibility' => ['Xiaomi 13 Pro Only'],
            'screen_protector' => ['Xiaomi 13 Pro Only']
        ],
    ],
    [
        'name' => 'Xiaomi Redmi Note 13 Pro+',
        'slug' => 'redmi-note-13-pro-plus',
        'brand' => 'Xiaomi',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.67 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['PD Charger', 'Standard Wireless'],
            'case_compatibility' => ['Redmi Note 13 Pro+ Only'],
            'screen_protector' => ['Redmi Note 13 Pro+ Only']
        ],
    ],
    [
        'name' => 'Xiaomi Redmi Note 12',
        'slug' => 'redmi-note-12',
        'brand' => 'Xiaomi',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.67 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C', 'USB-A to USB-C'],
            'charger_type' => ['Standard Charger'],
            'case_compatibility' => ['Redmi Note 12 Only'],
            'screen_protector' => ['Redmi Note 12 Only']
        ],
    ],

    // ------------------------------------------------------------------
    // Other Popular Devices
    // ------------------------------------------------------------------
    [
        'name' => 'OnePlus 12',
        'slug' => 'oneplus-12',
        'brand' => 'OnePlus',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.82 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C'],
            'charger_type' => ['SuperVOOC Charger', 'PD Charger'],
            'case_compatibility' => ['OnePlus 12 Only'],
            'screen_protector' => ['OnePlus 12 Only']
        ],
    ],
    [
        'name' => 'Google Pixel 8 Pro',
        'slug' => 'pixel-8-pro',
        'brand' => 'Google',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.7 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C'],
            'charger_type' => ['PD Charger', 'Qi Wireless'],
            'case_compatibility' => ['Pixel 8 Pro Only'],
            'screen_protector' => ['Pixel 8 Pro Only']
        ],
    ],
    [
        'name' => 'Huawei P60 Pro',
        'slug' => 'huawei-p60-pro',
        'brand' => 'Huawei',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.67 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C'],
            'charger_type' => ['SuperCharge', 'Wireless'],
            'case_compatibility' => ['P60 Pro Only'],
            'screen_protector' => ['P60 Pro Only']
        ],
    ],
    [
        'name' => 'Oppo Find X6 Pro',
        'slug' => 'oppo-find-x6-pro',
        'brand' => 'Oppo',
        'release_year' => 2023,
        'port_type' => 'USB-C',
        'screen_size' => '6.82 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C'],
            'charger_type' => ['SuperVOOC', 'AirVOOC Wireless'],
            'case_compatibility' => ['Find X6 Pro Only'],
            'screen_protector' => ['Find X6 Pro Only']
        ],
    ],
    [
        'name' => 'Vivo X100 Pro',
        'slug' => 'vivo-x100-pro',
        'brand' => 'Vivo',
        'release_year' => 2024,
        'port_type' => 'USB-C',
        'screen_size' => '6.78 inches',
        'compatibility_rules' => [
            'cable_type' => ['USB-C to USB-C'],
            'charger_type' => ['FlashCharge', 'Wireless'],
            'case_compatibility' => ['X100 Pro Only'],
            'screen_protector' => ['X100 Pro Only']
        ],
    ],
];
