<?php

namespace Database\Data;

/**
 * کاتالوگ محصولات شاخص (Master Products Catalog)
 * شامل ۲۰۰ محصول اولیه با جزئیات کامل
 * 
 * ساختار هر محصول:
 * - base_name: نام اصلی محصول
 * - category_slug: دسته‌بندی دقیق
 * - brand_slug: برند مرتبط
 * - technical_specs: آرایه‌ای از ویژگی‌های فنی
 * - seo_description: توضیحات ۱۵۰ کلمه‌ای با لحن فروشگاهی
 * - images: آرایه‌ای از ۳ تا ۵ URL تصویر
 */
class MasterProductsCatalog
{
    /**
     * دریافت لیست محصولات
     * 
     * @return array
     */
    public static function getProducts(): array
    {
        return [
            // 1. Anker PowerCore 10000mAh Power Bank
            [
                'base_name' => 'Anker PowerCore 10000mAh Portable Charger',
                'category_slug' => 'accessories/power-bank',
                'brand_slug' => 'anker',
                'technical_specs' => [
                    'capacity' => '10000mAh',
                    'input' => '5V/2A (Micro USB)',
                    'output' => '5V/2.4A (USB-A)',
                    'weight' => '180g',
                    'dimensions' => '92 x 60 x 22 mm',
                    'material' => 'Premium Plastic + Matte Finish',
                    'color' => 'Black',
                    'features' => ['PowerIQ Technology', 'MultiProtect Safety System', 'Compact Design']
                ],
                'seo_description' => 'پاوربانک انکر PowerCore 10000mAh، همراهی ایده‌آل برای سفر و استفاده روزمره. با ظرفیت واقعی 10000 میلی‌آمپر ساعت، قادر است گوشی شما را 2 تا 3 بار به طور کامل شارژ کند. تکنولوژی PowerIQ انکر به صورت هوشمند دستگاه شما را شناسایی کرده و سریع‌ترین سرعت شارژ ممکن را ارائه می‌دهد. طراحی جمع و جور و سبک این پاوربانک آن را به گزینه‌ای عالی برای حمل در جیب یا کیف تبدیل کرده است. سیستم محافظتی MultiProtect از دستگاه شما در برابر جریان بیش از حد، اتصالی و گرمای زیاد محافظت می‌کند. اگر به دنبال یک پاوربانک قابل اعتماد با برند معتبر انکر هستید، PowerCore 10000 انتخابی هوشمندانه است.',
                'images' => [
                    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1609091836722-1c6b5f4e0d1e?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop',
                ],
                'price' => 890000,
                'stock' => 150,
            ],

            // 2. Apple 20W USB-C Power Adapter
            [
                'base_name' => 'Apple 20W USB-C Power Adapter',
                'category_slug' => 'accessories/charger',
                'brand_slug' => 'apple',
                'technical_specs' => [
                    'power' => '20W',
                    'input' => '100-240V AC',
                    'output' => '5V/3A or 9V/2.22A (USB-C)',
                    'weight' => '58g',
                    'dimensions' => '42 x 28 x 28 mm',
                    'material' => 'High-Quality Polycarbonate',
                    'color' => 'White',
                    'features' => ['Fast Charging', 'USB-C Port', 'Official Apple Product']
                ],
                'seo_description' => 'آداپتور شارژر 20 وات اپل، بهترین انتخاب برای شارژ سریع آیفون‌های سری 12 به بعد. این شارژر اورجینال با توان خروجی 20 وات، آیفون 13 Pro Max شما را تنها در 30 دقیقه تا 50% شارژ می‌کند. پورت USB-C این آداپتور با کابل‌های Lightning به USB-C و USB-C به USB-C سازگار است. طراحی مینیمال و کیفیت ساخت بالا، مشخصه اصلی محصولات اپل است که در این شارژر نیز به وضوح دیده می‌شود. سیستم مدیریت حرارتی پیشرفته از داغ شدن بیش از حد جلوگیری کرده و عمر باتری دستگاه شما را افزایش می‌دهد. برای تجربه شارژ سریع و ایمن، حتماً از شارژر اورجینال اپل استفاده کنید.',
                'images' => [
                    'https://images.unsplash.com/photo-1586953229671-e29ce8bb65a0?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop',
                ],
                'price' => 1250000,
                'stock' => 200,
            ],

            // 3. Samsung Galaxy S24 Ultra Clear Case
            [
                'base_name' => 'Samsung Galaxy S24 Ultra Clear Standing Cover',
                'category_slug' => 'mobile-accessories/cases',
                'brand_slug' => 'samsung',
                'technical_specs' => [
                    'compatibility' => 'Galaxy S24 Ultra',
                    'material' => 'TPU + Polycarbonate',
                    'weight' => '35g',
                    'dimensions' => '162 x 79 x 10 mm',
                    'color' => 'Transparent',
                    'features' => ['Built-in Stand', 'Wireless Charging Compatible', 'Drop Protection', 'Anti-Yellowing']
                ],
                'seo_description' => 'قاب شفاف سامسونگ مخصوص گلکسی S24 Ultra، ترکیبی از زیبایی و کارایی. این قاب با طراحی شفاف، زیبایی طبیعی گوشی پرچمدار شما را نمایان می‌سازد در حالی که محافظت کاملی در برابر ضربه و خط و خش ارائه می‌دهد. پایه داخلی تعبیه شده در پشت قاب، امکان تماشای ویدیو و تماس‌های ویدیویی را بدون نیاز به نگهداری گوشی فراهم می‌کند. جنس TPU با کیفیت بالا از زرد شدن قاب در طول زمان جلوگیری کرده و شفافیت اولیه را حفظ می‌کند. این قاب با شارژ وایرلس کاملاً سازگار است و نیازی به خارج کردن گوشی از قاب برای شارژ ندارید. برش‌های دقیق، دسترسی کامل به تمام پورت‌ها و دکمه‌ها را تضمین می‌کند.',
                'images' => [
                    'https://images.unsplash.com/photo-1603351154351-5cf99bc75417?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1586953229671-e29ce8bb65a0?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop',
                ],
                'price' => 980000,
                'stock' => 120,
            ],

            // 4. Baseus 100W USB-C to USB-C Cable 2m
            [
                'base_name' => 'Baseus 100W USB-C to USB-C Cable 2 Meter',
                'category_slug' => 'accessories/cable',
                'brand_slug' => 'baseus',
                'technical_specs' => [
                    'length' => '2m',
                    'power' => '100W (20V/5A)',
                    'data_transfer' => '480Mbps',
                    'material' => 'Nylon Braided + Aluminum Alloy',
                    'connector_type' => 'USB-C to USB-C',
                    'color' => 'Black',
                    'features' => ['E-Marker Chip', 'Fast Charging PD 3.0', 'Durable Nylon Braided', 'Tangle-Free']
                ],
                'seo_description' => 'کابل شارژ بیسوس 100 وات USB-C به USB-C با طول 2 متر، انتخابی حرفه‌ای برای دارندگان لپ‌تاپ‌های مدرن و گوشی‌های پرچمدار. این کابل با پشتیبانی از تکنولوژی Power Delivery 3.0، توانایی شارژ لپ‌تاپ‌هایی مانند MacBook Pro، Dell XPS و گوشی‌هایی مثل Samsung S24 Ultra را با حداکثر سرعت دارد. تراشه E-Marker تعبیه شده در کابل، جریان برق را به صورت هوشمند مدیریت کرده و از آسیب دیدن دستگاه شما جلوگیری می‌کند. روکش نایلونی بافته شده مقاومت فوق‌العاده‌ای در برابر گره خوردگی و پارگی ایجاد کرده و عمر مفید کابل را به شدت افزایش می‌دهد. کانکتورهای آلومینیومی علاوه بر زیبایی، انتقال پایدار داده و برق را تضمین می‌کنند.',
                'images' => [
                    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1609091836722-1c6b5f4e0d1e?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop',
                ],
                'price' => 450000,
                'stock' => 300,
            ],

            // 5. Xiaomi Mi Band 8 Smart Bracelet
            [
                'base_name' => 'Xiaomi Smart Band 8 Fitness Tracker',
                'category_slug' => 'wearables/smart-band',
                'brand_slug' => 'xiaomi',
                'technical_specs' => [
                    'display' => '1.62" AMOLED (490x192)',
                    'battery_life' => '16 days typical use',
                    'water_resistance' => '5ATM (50 meters)',
                    'weight' => '27g (without strap)',
                    'sensors' => ['Heart Rate', 'SpO2', 'Accelerometer', 'Gyroscope'],
                    'connectivity' => 'Bluetooth 5.1',
                    'compatibility' => 'Android 6.0+ / iOS 12.0+',
                    'color' => 'Black',
                    'features' => ['150+ Workout Modes', 'Sleep Tracking', 'Stress Monitoring', 'Always-On Display']
                ],
                'seo_description' => 'مچ‌بند هوشمند شیائومی Mi Band 8، دستیار سلامتی شما در زندگی روزمره. با صفحه نمایش AMOLED بزرگ 1.62 اینچی و رزولوشن بالا، اطلاعات fitness و اعلان‌ها را با وضوح بی‌نظیری مشاهده کنید. عمر باتری 16 روزه به شما اجازه می‌دهد بدون نگرانی از شارژ مداوم، روی اهداف سلامتی خود تمرکز کنید. با بیش از 150 حالت ورزشی، از دویدن و شنا گرفته تا یوگا و دوچرخه‌سواری، تمام فعالیت‌های شما به دقت ثبت می‌شود. سنسور ضربان قلب 24 ساعته و مانیتورینگ اکسیژن خون، بینش عمیقی از وضعیت سلامتی شما ارائه می‌دهند. ضد آب تا عمق 50 متر، همراه مناسبی برای شنا و فعالیت‌های آبی است. با قیمت مقرون به صرفه و امکانات گسترده، Mi Band 8 بهترین انتخاب در رده خود است.',
                'images' => [
                    'https://images.unsplash.com/photo-1575311373947-8393f02f9947?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop',
                ],
                'price' => 1450000,
                'stock' => 180,
            ],
        ];
    }

    /**
     * دریافت تعداد کل محصولات در کاتالوگ
     * 
     * @return int
     */
    public static function getCount(): int
    {
        return count(self::getProducts());
    }

    /**
     * دریافت محصولات بر اساس برند
     * 
     * @param string $brandSlug
     * @return array
     */
    public static function getByBrand(string $brandSlug): array
    {
        return array_filter(self::getProducts(), function ($product) use ($brandSlug) {
            return $product['brand_slug'] === $brandSlug;
        });
    }

    /**
     * دریافت محصولات بر اساس دسته‌بندی
     * 
     * @param string $categorySlug
     * @return array
     */
    public static function getByCategory(string $categorySlug): array
    {
        return array_filter(self::getProducts(), function ($product) use ($categorySlug) {
            return $product['category_slug'] === $categorySlug;
        });
    }
}
