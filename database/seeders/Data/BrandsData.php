<?php

namespace Database\Seeders\Data;

/**
 * Brands Data - 50+ Global and Local Brands
 */
class BrandsData
{
    /**
     * Get all brands for seeding
     * 
     * @return array
     */
    public static function getBrands(): array
    {
        return [
            // Global Giants
            [
                'name' => 'Apple',
                'slug' => 'apple',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/apple.svg',
                'description_short' => 'پیشرو در نوآوری‌های تکنولوژی و طراحی محصولات دیجیتال',
                'is_featured' => true,
            ],
            [
                'name' => 'Samsung',
                'slug' => 'samsung',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/samsung.svg',
                'description_short' => 'غول کره‌ای تولیدکننده لوازم الکترونیکی و موبایل',
                'is_featured' => true,
            ],
            [
                'name' => 'Xiaomi',
                'slug' => 'xiaomi',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/xiaomi.svg',
                'description_short' => 'برند چینی با محصولات باکیفیت و قیمت مناسب',
                'is_featured' => true,
            ],
            [
                'name' => 'Anker',
                'slug' => 'anker',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anker.svg',
                'description_short' => 'تخصصی‌ترین برند در زمینه لوازم جانبی شارژ و پاوربانک',
                'is_featured' => true,
            ],
            // Premium Accessories
            [
                'name' => 'Spigen',
                'slug' => 'spigen',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spigen.svg',
                'description_short' => 'تولیدکننده کره‌ای قاب‌ها و محافظ‌های باکیفیت',
                'is_featured' => true,
            ],
            [
                'name' => 'OtterBox',
                'slug' => 'otterbox',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/otterbox.svg',
                'description_short' => 'محافظ‌های فوق‌العاده مقاوم برای دستگاه‌های موبایل',
                'is_featured' => false,
            ],
            [
                'name' => 'Baseus',
                'slug' => 'baseus',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/baseus.svg',
                'description_short' => 'لوازم جانبی هوشمند با طراحی مدرن',
                'is_featured' => true,
            ],
            [
                'name' => 'Ugreen',
                'slug' => 'ugreen',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ugreen.svg',
                'description_short' => 'تجهیزات اتصال و تبدیل با کیفیت بالا',
                'is_featured' => true,
            ],
            // Audio Specialists
            [
                'name' => 'Sony',
                'slug' => 'sony',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/sony.svg',
                'description_short' => 'پیشرو در صنعت صدا و تصویر',
                'is_featured' => true,
            ],
            [
                'name' => 'JBL',
                'slug' => 'jbl',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/jbl.svg',
                'description_short' => 'سیستم‌های صوتی حرفه‌ای و اسپیکرهای قابل حمل',
                'is_featured' => true,
            ],
            [
                'name' => 'Sennheiser',
                'slug' => 'sennheiser',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/sennheiser.svg',
                'description_short' => 'هدفون‌ها و هندزفری‌های آلمانی با کیفیت استودیویی',
                'is_featured' => false,
            ],
            [
                'name' => 'Bose',
                'slug' => 'bose',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/bose.svg',
                'description_short' => 'نوآوری در حذف نویز و کیفیت صدا',
                'is_featured' => false,
            ],
            // Charging & Cables
            [
                'name' => 'Belkin',
                'slug' => 'belkin',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/belkin.svg',
                'description_short' => 'لوازم جانبی معتبر با گارانتی مادام‌العمر',
                'is_featured' => false,
            ],
            [
                'name' => 'Aukey',
                'slug' => 'aukey',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/aukey.svg',
                'description_short' => 'شارژرها و آداپتورهای سریع و مطمئن',
                'is_featured' => false,
            ],
            [
                'name' => 'RAVPower',
                'slug' => 'ravpower',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ravpower.svg',
                'description_short' => 'پاوربانک‌ها و شارژرهای پرسرعت',
                'is_featured' => false,
            ],
            // Iranian & Regional Brands
            [
                'name' => 'باور (Bavar)',
                'slug' => 'bavar',
                'logo_url' => 'https://via.placeholder.com/100x100?text=Bavar',
                'description_short' => 'برند ایرانی تولیدکننده لوازم جانبی موبایل',
                'is_featured' => true,
            ],
            [
                'name' => 'گرین‌لاین (Green Line)',
                'slug' => 'green-line',
                'logo_url' => 'https://via.placeholder.com/100x100?text=GreenLine',
                'description_short' => 'محصولات باکیفیت با قیمت رقابتی',
                'is_featured' => true,
            ],
            [
                'name' => 'ماکسیدر (Maxiderm)',
                'slug' => 'maxiderm',
                'logo_url' => 'https://via.placeholder.com/100x100?text=Maxiderm',
                'description_short' => 'تولیدکننده ایرانی محافظ صفحه و قاب',
                'is_featured' => false,
            ],
            // More International Brands
            [
                'name' => 'Logitech',
                'slug' => 'logitech',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/logitech.svg',
                'description_short' => 'تجهیزات جانبی کامپیوتر و گیمینگ',
                'is_featured' => true,
            ],
            [
                'name' => 'Huawei',
                'slug' => 'huawei',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/huawei.svg',
                'description_short' => 'تکنولوژی پیشرفته و نوآوری',
                'is_featured' => true,
            ],
            [
                'name' => 'OnePlus',
                'slug' => 'oneplus',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/oneplus.svg',
                'description_short' => 'پرچمداران قاتل با قیمت مناسب',
                'is_featured' => false,
            ],
            [
                'name' => 'Google',
                'slug' => 'google',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg',
                'description_short' => 'محصولات پیکسل و لوازم جانبی هوشمند',
                'is_featured' => false,
            ],
            [
                'name' => 'Nothing',
                'slug' => 'nothing',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nothing.svg',
                'description_short' => 'طراحی شفاف و متفاوت در دنیای تکنولوژی',
                'is_featured' => false,
            ],
        ];
    }
}
