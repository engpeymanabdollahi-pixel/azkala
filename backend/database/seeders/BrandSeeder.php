<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏷️ در حال ساخت یا به‌روزرسانی برندها...');

        $brands = [
            // ===== موبایل و تکنولوژی =====
            ['name' => 'Samsung', 'slug' => 'samsung', 'description' => 'Samsung Electronics - پیشرو در صنعت موبایل', 'country' => 'South Korea', 'website' => 'https://www.samsung.com', 'is_featured' => true, 'verification_badge' => 'diamond'],
            ['name' => 'Apple', 'slug' => 'apple', 'description' => 'Apple Inc. - نوآوری در هر محصول', 'country' => 'USA', 'website' => 'https://www.apple.com', 'is_featured' => true, 'verification_badge' => 'diamond'],
            ['name' => 'Xiaomi', 'slug' => 'xiaomi', 'description' => 'Xiaomi Corporation - تکنولوژی مقرون‌به‌صرفه', 'country' => 'China', 'website' => 'https://www.mi.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Huawei', 'slug' => 'huawei', 'description' => 'Huawei Technologies - رهبر ارتباطات', 'country' => 'China', 'website' => 'https://www.huawei.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'OnePlus', 'slug' => 'oneplus', 'description' => 'OnePlus - Never Settle', 'country' => 'China', 'website' => 'https://www.oneplus.com', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Google', 'slug' => 'google', 'description' => 'Google Pixel - هوش مصنوعی در دستان شما', 'country' => 'USA', 'website' => 'https://store.google.com', 'is_featured' => true, 'verification_badge' => 'diamond'],
            ['name' => 'Sony', 'slug' => 'sony', 'description' => 'Sony Corporation - کیفیت ژاپنی', 'country' => 'Japan', 'website' => 'https://www.sony.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'LG', 'slug' => 'lg', 'description' => 'LG Electronics - Life is Good', 'country' => 'South Korea', 'website' => 'https://www.lg.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Honor', 'slug' => 'honor', 'description' => 'Honor Brand - نوآوری برای همه', 'country' => 'China', 'website' => 'https://www.hihonor.com', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Oppo', 'slug' => 'oppo', 'description' => 'Oppo - تکنولوژی پیشرفته', 'country' => 'China', 'website' => 'https://www.oppo.com', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Vivo', 'slug' => 'vivo', 'description' => 'Vivo - دوربین محوری', 'country' => 'China', 'website' => 'https://www.vivo.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Realme', 'slug' => 'realme', 'description' => 'Realme - Dare to Leap', 'country' => 'China', 'website' => 'https://www.realme.com', 'is_featured' => false, 'verification_badge' => 'none'],
            ['name' => 'Nothing', 'slug' => 'nothing', 'description' => 'Nothing - طراحی شفاف', 'country' => 'UK', 'website' => 'https://www.nothing.tech', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Motorola', 'slug' => 'motorola', 'description' => 'Motorola - اصالت آمریکایی', 'country' => 'USA', 'website' => 'https://www.motorola.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Nokia', 'slug' => 'nokia', 'description' => 'Nokia - قابل اعتماد', 'country' => 'Finland', 'website' => 'https://www.nokia.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            
            // ===== لوازم جانبی و شارژر =====
            ['name' => 'Anker', 'slug' => 'anker', 'description' => 'Anker Innovations - رهبر شارژرهای سریع', 'country' => 'USA', 'website' => 'https://www.anker.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Baseus', 'slug' => 'baseus', 'description' => 'Baseus - لوازم جانبی باکیفیت', 'country' => 'China', 'website' => 'https://www.baseus.com', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Nillkin', 'slug' => 'nillkin', 'description' => 'Nillkin - قاب و گلس حرفه‌ای', 'country' => 'China', 'website' => 'https://www.nillkin.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Spigen', 'slug' => 'spigen', 'description' => 'Spigen - محافظت عالی', 'country' => 'South Korea', 'website' => 'https://www.spigen.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Ugreen', 'slug' => 'ugreen', 'description' => 'Ugreen - اتصالات مطمئن', 'country' => 'China', 'website' => 'https://www.ugreen.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Belkin', 'slug' => 'belkin', 'description' => 'Belkin - کیفیت آمریکایی', 'country' => 'USA', 'website' => 'https://www.belkin.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Aukey', 'slug' => 'aukey', 'description' => 'Aukey - شارژرهای اقتصادی', 'country' => 'China', 'website' => 'https://www.aukey.com', 'is_featured' => false, 'verification_badge' => 'none'],
            ['name' => 'Mophie', 'slug' => 'mophie', 'description' => 'Mophie - پاوربانک‌های لوکس', 'country' => 'USA', 'website' => 'https://www.mophie.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Zendure', 'slug' => 'zendure', 'description' => 'Zendure - تکنولوژی سفر', 'country' => 'USA', 'website' => 'https://www.zendure.com', 'is_featured' => false, 'verification_badge' => 'none'],
            ['name' => 'Pitaka', 'slug' => 'pitaka', 'description' => 'Pitaka - فیبر کربن', 'country' => 'China', 'website' => 'https://www.pitaka.com', 'is_featured' => false, 'verification_badge' => 'none'],
            
            // ===== هدفون و اسپیکر =====
            ['name' => 'JBL', 'slug' => 'jbl', 'description' => 'JBL - صدای بی‌نظیر', 'country' => 'USA', 'website' => 'https://www.jbl.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Bose', 'slug' => 'bose', 'description' => 'Bose - حذف نویز پیشرفته', 'country' => 'USA', 'website' => 'https://www.bose.com', 'is_featured' => true, 'verification_badge' => 'diamond'],
            ['name' => 'Sennheiser', 'slug' => 'sennheiser', 'description' => 'Sennheiser - کیفیت صوت آلمانی', 'country' => 'Germany', 'website' => 'https://www.sennheiser.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Audio-Technica', 'slug' => 'audio-technica', 'description' => 'Audio-Technica - حرفه‌ای‌ها انتخاب می‌کنند', 'country' => 'Japan', 'website' => 'https://www.audio-technica.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Beats', 'slug' => 'beats', 'description' => 'Beats by Dre - سبک و صدا', 'country' => 'USA', 'website' => 'https://www.beatsbydre.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Edifier', 'slug' => 'edifier', 'description' => 'Edifier - اسپیکرهای باکیفیت', 'country' => 'China', 'website' => 'https://www.edifier.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Marshall', 'slug' => 'marshall', 'description' => 'Marshall - راک اند رول', 'country' => 'UK', 'website' => 'https://www.marshallheadphones.com', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Jabra', 'slug' => 'jabra', 'description' => 'Jabra - مکالمه واضح', 'country' => 'Denmark', 'website' => 'https://www.jabra.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Soundcore', 'slug' => 'soundcore', 'description' => 'Soundcore by Anker -音质非凡', 'country' => 'USA', 'website' => 'https://www.soundcore.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => '1MORE', 'slug' => '1more', 'description' => '1MORE - چهار درایور', 'country' => 'China', 'website' => 'https://www.1more.com', 'is_featured' => false, 'verification_badge' => 'none'],
            
            // ===== ساعت هوشمند =====
            ['name' => 'Garmin', 'slug' => 'garmin', 'description' => 'Garmin - ناوبری و ورزش', 'country' => 'USA', 'website' => 'https://www.garmin.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Amazfit', 'slug' => 'amazfit', 'description' => 'Amazfit - سلامتی دیجیتال', 'country' => 'China', 'website' => 'https://www.amazfit.com', 'is_featured' => true, 'verification_badge' => 'gold'],
            ['name' => 'Fitbit', 'slug' => 'fitbit', 'description' => 'Fitbit by Google - تناسب اندام', 'country' => 'USA', 'website' => 'https://www.fitbit.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Suunto', 'slug' => 'suunto', 'description' => 'Suunto - ورزش‌های بیرون', 'country' => 'Finland', 'website' => 'https://www.suunto.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Polar', 'slug' => 'polar', 'description' => 'Polar - علم ورزش', 'country' => 'Finland', 'website' => 'https://www.polar.com', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'Coros', 'slug' => 'coros', 'description' => 'Coros - دویدن حرفه‌ای', 'country' => 'USA', 'website' => 'https://www.coros.com', 'is_featured' => false, 'verification_badge' => 'none'],
            
            // ===== برندهای ایرانی =====
            ['name' => 'متین', 'slug' => 'matin', 'description' => 'متین - تولید ملی', 'country' => 'Iran', 'website' => 'https://www.matin.ir', 'is_featured' => false, 'verification_badge' => 'gold'],
            ['name' => 'گرین لاین', 'slug' => 'green-line', 'description' => 'گرین لاین - لوازم جانبی', 'country' => 'Iran', 'website' => null, 'is_featured' => false, 'verification_badge' => 'none'],
            ['name' => 'ماکروسی', 'slug' => 'macrocell', 'description' => 'ماکروسی - باتری و شارژر', 'country' => 'Iran', 'website' => null, 'is_featured' => false, 'verification_badge' => 'none'],
            ['name' => 'های‌کپی', 'slug' => 'highcopy', 'description' => 'های‌کپی - کیفیت قابل قبول', 'country' => 'Iran', 'website' => null, 'is_featured' => false, 'verification_badge' => 'none'],
            
            // ===== تبلت و لپ‌تاپ =====
            ['name' => 'Microsoft', 'slug' => 'microsoft', 'description' => 'Microsoft Surface - بهره‌وری', 'country' => 'USA', 'website' => 'https://www.microsoft.com', 'is_featured' => true, 'verification_badge' => 'diamond'],
            ['name' => 'Lenovo', 'slug' => 'lenovo', 'description' => 'Lenovo - ThinkPad و IdeaPad', 'country' => 'China', 'website' => 'https://www.lenovo.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Asus', 'slug' => 'asus', 'description' => 'Asus - ZenBook و ROG', 'country' => 'Taiwan', 'website' => 'https://www.asus.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'HP', 'slug' => 'hp', 'description' => 'HP - Hewlett Packard', 'country' => 'USA', 'website' => 'https://www.hp.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Dell', 'slug' => 'dell', 'description' => 'Dell - XPS و Latitude', 'country' => 'USA', 'website' => 'https://www.dell.com', 'is_featured' => true, 'verification_badge' => 'platinum'],
            ['name' => 'Acer', 'slug' => 'acer', 'description' => 'Acer - Swift و Predator', 'country' => 'Taiwan', 'website' => 'https://www.acer.com', 'is_featured' => false, 'verification_badge' => 'gold'],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['slug' => $brand['slug']],
                [
                    'name' => $brand['name'],
                    'description' => $brand['description'] ?? null,
                    'country' => $brand['country'] ?? null,
                    'website' => $brand['website'] ?? null,
                    'is_featured' => $brand['is_featured'] ?? false,
                    'verification_badge' => $brand['verification_badge'] ?? 'none',
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('✅ ' . Brand::count() . ' برند با موفقیت ساخته یا به‌روزرسانی شدند!');
    }
}