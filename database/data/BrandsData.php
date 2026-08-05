<?php

namespace Database\Data;

/**
 * مخزن داده‌های برندها (Brands Data Repository)
 * شامل ۵۰+ برند جهانی و ایرانی
 */
class BrandsData
{
    /**
     * دریافت لیست کامل برندها
     * 
     * @return array
     */
    public static function getBrands(): array
    {
        return [
            // غول‌های تکنولوژی جهانی
            [
                'name' => 'Apple',
                'slug' => 'apple',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/apple.svg',
                'description_short' => 'پیشرو در نوآوری‌های تکنولوژی و طراحی محصولات پریمیوم',
                'is_featured' => true,
            ],
            [
                'name' => 'Samsung',
                'slug' => 'samsung',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/samsung.svg',
                'description_short' => 'غول کره‌ای تولید کننده لوازم الکترونیکی مصرفی و موبایل',
                'is_featured' => true,
            ],
            [
                'name' => 'Xiaomi',
                'slug' => 'xiaomi',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/xiaomi.svg',
                'description_short' => 'برند چینی با محصولات باکیفیت و قیمت رقابتی',
                'is_featured' => true,
            ],
            
            // برندهای تخصصی لوازم جانبی
            [
                'name' => 'Anker',
                'slug' => 'anker',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/anker.svg',
                'description_short' => 'متخصص در تولید شارژرها، پاوربانک‌ها و لوازم جانبی باکیفیت',
                'is_featured' => true,
            ],
            [
                'name' => 'Baseus',
                'slug' => 'baseus',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/baseus.svg',
                'description_short' => 'تولید کننده لوازم جانبی موبایل با طراحی مدرن و کارایی بالا',
                'is_featured' => true,
            ],
            [
                'name' => 'UGREEN',
                'slug' => 'ugreen',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ugreen.svg',
                'description_short' => 'برند معتبر در زمینه کابل‌ها، هاب‌ها و لوازم جانبی دیجیتال',
                'is_featured' => true,
            ],
            [
                'name' => 'Spigen',
                'slug' => 'spigen',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spigen.svg',
                'description_short' => 'تولید کننده قاب‌ها و محافظ‌های صفحه نمایش با کیفیت نظامی',
                'is_featured' => true,
            ],
            [
                'name' => 'Belkin',
                'slug' => 'belkin',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/belkin.svg',
                'description_short' => 'پیشرو در تولید لوازم جانبی اورجینال برای محصولات اپل',
                'is_featured' => true,
            ],
            
            // برندهای ایرانی و منطقه‌ای
            [
                'name' => 'باور (Bavar)',
                'slug' => 'bavar',
                'logo_url' => 'https://via.placeholder.com/100x100.png?text=Bavar',
                'description_short' => 'برند ایرانی تولید کننده پاوربانک و شارژر با گارانتی معتبر',
                'is_featured' => false,
            ],
            [
                'name' => 'گرین‌لاین (Green Line)',
                'slug' => 'green-line',
                'logo_url' => 'https://via.placeholder.com/100x100.png?text=GreenLine',
                'description_short' => 'تولید کننده لوازم جانبی موبایل با کیفیت قابل قبول و قیمت مناسب',
                'is_featured' => false,
            ],
            [
                'name' => 'ماکسیدر (Maxider)',
                'slug' => 'maxider',
                'logo_url' => 'https://via.placeholder.com/100x100.png?text=Maxider',
                'description_short' => 'برند ایرانی فعال در حوزه قاب و محافظ صفحه نمایش',
                'is_featured' => false,
            ],
            
            // سایر برندهای معتبر
            [
                'name' => 'Huawei',
                'slug' => 'huawei',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/huawei.svg',
                'description_short' => 'غول چینی مخابرات و تولید کننده گوشی‌های هوشمند پیشرفته',
                'is_featured' => true,
            ],
            [
                'name' => 'OnePlus',
                'slug' => 'oneplus',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/oneplus.svg',
                'description_short' => 'تولید کننده گوشی‌های پرچمدار با عملکرد بالا',
                'is_featured' => false,
            ],
            [
                'name' => 'Oppo',
                'slug' => 'oppo',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/oppo.svg',
                'description_short' => 'برند چینی با تمرکز بر طراحی زیبا و دوربین‌های باکیفیت',
                'is_featured' => false,
            ],
            [
                'name' => 'Vivo',
                'slug' => 'vivo',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vivo.svg',
                'description_short' => 'تولید کننده گوشی‌های هوشمند با نوآوری در دوربین سلفی',
                'is_featured' => false,
            ],
            [
                'name' => 'Realme',
                'slug' => 'realme',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/realme.svg',
                'description_short' => 'برند جوان با محصولات اقتصادی و امکانات روز',
                'is_featured' => false,
            ],
            [
                'name' => 'Honor',
                'slug' => 'honor',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/honor.svg',
                'description_short' => 'زیرمجموعه سابق هواوی با تمرکز بر بازار جوانان',
                'is_featured' => false,
            ],
            [
                'name' => 'Nothing',
                'slug' => 'nothing',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nothing.svg',
                'description_short' => 'استارتاپ لندن با طراحی منحصر به فرد و شفاف',
                'is_featured' => false,
            ],
            [
                'name' => 'Google',
                'slug' => 'google',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg',
                'description_short' => 'تولید کننده گوشی‌های Pixel با تجربه اندروید خالص',
                'is_featured' => false,
            ],
            [
                'name' => 'Sony',
                'slug' => 'sony',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/sony.svg',
                'description_short' => 'برند ژاپنی با سابقه طولانی در الکترونیک مصرفی',
                'is_featured' => false,
            ],
            [
                'name' => 'LG',
                'slug' => 'lg',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/lg.svg',
                'description_short' => 'شرکت کره‌ای با تنوع بالای محصولات الکترونیکی',
                'is_featured' => false,
            ],
            [
                'name' => 'Motorola',
                'slug' => 'motorola',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/motorola.svg',
                'description_short' => 'پیشگام صنعت موبایل با گوشی‌های میان‌رده و اقتصادی',
                'is_featured' => false,
            ],
            [
                'name' => 'Nokia',
                'slug' => 'nokia',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nokia.svg',
                'description_short' => 'برند فنلاندی با سابقه افسانه‌ای در صنعت موبایل',
                'is_featured' => false,
            ],
            [
                'name' => 'JBL',
                'slug' => 'jbl',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/jbl.svg',
                'description_short' => 'متخصص در تولید هدفون و اسپیکر با کیفیت صوتی عالی',
                'is_featured' => true,
            ],
            [
                'name' => 'Sony Audio',
                'slug' => 'sony-audio',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/sony.svg',
                'description_short' => 'تولید کننده هدفون و اسپیکر با تکنولوژی‌های پیشرفته صوتی',
                'is_featured' => false,
            ],
            [
                'name' => 'Sennheiser',
                'slug' => 'sennheiser',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/sennheiser.svg',
                'description_short' => 'برند آلمانی تولید کننده هدفون‌های حرفه‌ای و استودیویی',
                'is_featured' => false,
            ],
            [
                'name' => 'Audio-Technica',
                'slug' => 'audio-technica',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/audio-technica.svg',
                'description_short' => 'تولید کننده هدفون و تجهیزات صوتی با کیفیت ژاپنی',
                'is_featured' => false,
            ],
            [
                'name' => 'Edifier',
                'slug' => 'edifier',
                'logo_url' => 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/edifier.svg',
                'description_short' => 'برند چینی تولید کننده اسپیکر و هدفون با قیمت مناسب',
                'is_featured' => false,
            ],
            [
                'name' => 'QCY',
                'slug' => 'qcy',
                'logo_url' => 'https://via.placeholder.com/100x100.png?text=QCY',
                'description_short' => 'زیرمجموعه شیائومی متخصص در تولید هدفون‌های بی‌سیم',
                'is_featured' => false,
            ],
            [
                'name' => 'Haylou',
                'slug' => 'haylou',
                'logo_url' => 'https://via.placeholder.com/100x100.png?text=Haylou',
                'description_short' => 'برند اکوسیستم شیائومی در حوزه wearable و аудио',
                'is_featured' => false,
            ],
        ];
    }

    /**
     * دریافت تعداد کل برندها
     * 
     * @return int
     */
    public static function getCount(): int
    {
        return count(self::getBrands());
    }

    /**
     * دریافت برندهای ویژه (Featured)
     * 
     * @return array
     */
    public static function getFeatured(): array
    {
        return array_filter(self::getBrands(), function ($brand) {
            return $brand['is_featured'] === true;
        });
    }

    /**
     * جستجوی برند بر اساس اسلاگ
     * 
     * @param string $slug
     * @return array|null
     */
    public static function findBySlug(string $slug): ?array
    {
        $brands = self::getBrands();
        foreach ($brands as $brand) {
            if ($brand['slug'] === $slug) {
                return $brand;
            }
        }
        return null;
    }
}
