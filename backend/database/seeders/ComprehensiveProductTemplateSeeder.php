<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\DeviceModel;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ComprehensiveProductTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📦 در حال ایجاد کتابخانه جامع محصولات آماده با عکس‌ها و مشخصات واقعی...');

        // دریافت دسته‌بندی‌ها
        $caseCategory = Category::where('slug', 'phone-cases')->first();
        $glassCategory = Category::where('slug', 'screen-protectors')->first();
        $chargerCategory = Category::where('slug', 'chargers-cables')->first();
        $audioCategory = Category::where('slug', 'headphones-audio')->first();
        $powerbankCategory = Category::where('slug', 'power-banks')->first();
        $watchCategory = Category::where('slug', 'smartwatches')->first();
        $holderCategory = Category::where('slug', 'holders-stands')->first();
        
        if (!$caseCategory || !$glassCategory) {
            $this->command->error('❌ لطفاً ابتدا CategorySeeder را اجرا کنید!');
            return;
        }

        // دریافت برندها
        $spigen = Brand::where('slug', 'spigen')->first();
        $anker = Brand::where('slug', 'anker')->first();
        $baseus = Brand::where('slug', 'baseus')->first();
        $samsung = Brand::where('name', 'Samsung')->first();
        $apple = Brand::where('name', 'Apple')->first();
        
        // اگر برندها نیستند، می‌سازیم
        if (!$spigen) {
            $spigen = Brand::create([
                'name' => 'Spigen',
                'slug' => 'spigen',
                'logo' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&h=200&fit=crop',
                'description' => 'پیشرو در تولید لوازم جانبی محافظتی',
                'is_active' => true,
            ]);
        }

        if (!$anker) {
            $anker = Brand::create([
                'name' => 'Anker',
                'slug' => 'anker',
                'logo' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&h=200&fit=crop',
                'description' => 'تکنولوژی شارژ هوشمند',
                'is_active' => true,
            ]);
        }

        if (!$baseus) {
            $baseus = Brand::create([
                'name' => 'Baseus',
                'slug' => 'baseus',
                'logo' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&h=200&fit=crop',
                'description' => 'لوازم جانبی خلاقانه و باکیفیت',
                'is_active' => true,
            ]);
        }

        // دریافت مدل‌های دستگاه
        $iphone15ProMax = DeviceModel::where('slug', 'iphone-15-pro-max')->first();
        $iphone15Pro = DeviceModel::where('slug', 'iphone-15-pro')->first();
        $iphone15 = DeviceModel::where('slug', 'iphone-15')->first();
        $iphone14ProMax = DeviceModel::where('slug', 'iphone-14-pro-max')->first();
        $iphone13 = DeviceModel::where('slug', 'iphone-13')->first();
        $galaxyS24Ultra = DeviceModel::where('slug', 'galaxy-s24-ultra')->first();
        $galaxyS24 = DeviceModel::where('slug', 'galaxy-s24')->first();
        $galaxyS23Ultra = DeviceModel::where('slug', 'galaxy-s23-ultra')->first();
        $galaxyS23 = DeviceModel::where('slug', 'galaxy-s23')->first();

        $deviceModels = DeviceModel::all();
        
        if ($deviceModels->isEmpty()) {
            $this->command->error('❌ لطفاً ابتدا DeviceHierarchySeeder را اجرا کنید!');
            return;
        }

        $templates = [
            // ==================== قاب‌های گوشی (Phone Cases) ====================
            
            // Spigen Ultra Hybrid Series
            [
                'name' => 'قاب اسپایگن مدل Ultra Hybrid Clear',
                'slug' => 'spigen-ultra-hybrid-clear',
                'short_description' => 'قاب شفاف با تکنولوژی Air Cushion برای جذب ضربه',
                'description' => '<p>قاب Ultra Hybrid اسپایگن یکی از پرفروش‌ترین قاب‌های بازار است که با طراحی شفاف و زیبا، ضمن نمایش زیبایی گوشی شما، محافظت کاملی در برابر ضربه و خش ارائه می‌دهد.</p><h3>ویژگی‌های کلیدی:</h3><ul><li>تکنولوژی Air Cushion در چهار گوشه برای جذب حداکثری ضربه</li><li>بک پنل شفاف از جنس پلی‌کربنات مقاوم در برابر زرد شدن</li><li>لبه‌های برآمده 1.2 میلی‌متری برای محافظت از دوربین و صفحه نمایش</li><li>دکمه‌های فیزیکی با پوشش آلومینیومی برای حس بهتر کلیک</li><li>پشتیبانی کامل از شارژ وایرلس Qi</li></ul><h3>موارد داخل جعبه:</h3><ul><li>قاب Ultra Hybrid</li><li>دفترچه راهنما</li><li>کارت گارانتی 7 روزه</li></ul>',
                'price' => 450000,
                'compare_price' => 650000,
                'discount_price' => 425000,
                'stock' => 150,
                'sku' => 'SPG-UH-CLR-001',
                'category_id' => $caseCategory->id,
                'brand_id' => $spigen->id,
                'main_image' => 'https://images.unsplash.com/photo-1603351154351-7c676f7ff4e1?w=800&h=800&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1603351154351-7c676f7ff4e1?w=800&h=800&fit=crop',
                    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop',
                    'https://images.unsplash.com/photo-1586105740446-37086e25a7e6?w=800&h=800&fit=crop',
                ],
                'specifications' => [
                    'جنس بک پنل' => 'پلی‌کربنات شفاف (PC)',
                    'جنس لبه‌ها' => 'TPU نرم و انعطاف‌پذیر',
                    'رنگ' => 'شفاف (Crystal Clear)',
                    'وزن' => '35 گرم',
                    'ضخامت' => '1.2 میلی‌متر',
                    'محافظت' => 'ضد ضربه، ضد خش، ضد زردشدگی',
                    'شارژ وایرلس' => 'پشتیبانی کامل',
                    'گارانتی' => '7 روز ضمانت تعویض',
                    'کشور برند' => 'کره جنوبی',
                ],
                'device_model_ids' => [$iphone15ProMax?->id, $iphone15Pro?->id, $iphone15?->id],
                'is_featured' => true,
                'is_special_offer' => true,
            ],

            [
                'name' => 'قاب اسپایگن مدل Rugged Armor مشکی',
                'slug' => 'spigen-rugged-armor-black',
                'short_description' => 'قاب محافظتی سبک با طراحی کربنی و جذب ضربه عالی',
                'description' => '<p>Rugged Armor یکی از محبوب‌ترین قاب‌های اسپایگن است که با طراحی فیبر کربن و مواد TPU پیشرفته، محافظت فوق‌العاده‌ای در عین حفظ ظرافت ارائه می‌دهد.</p>',
                'price' => 380000,
                'compare_price' => 520000,
                'stock' => 200,
                'sku' => 'SPG-RA-BLK-001',
                'category_id' => $caseCategory->id,
                'brand_id' => $spigen->id,
                'main_image' => 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&h=800&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&h=800&fit=crop',
                ],
                'specifications' => [
                    'جنس' => 'TPU با طرح فیبر کربن',
                    'رنگ' => 'مشکی مات',
                    'وزن' => '28 گرم',
                    'تکنولوژی' => 'Air Cushion, Spider Web Pattern',
                    'شارژ وایرلس' => 'بله',
                ],
                'device_model_ids' => [$galaxyS24Ultra?->id, $galaxyS24?->id, $galaxyS23Ultra?->id],
                'is_featured' => true,
            ],

            [
                'name' => 'قاب سیلیکونی اپل مدل MagSafe Clear',
                'slug' => 'apple-magsafe-clear-case',
                'short_description' => 'قاب اصلی اپل با آهنربای MagSafe برای شارژ سریع‌تر',
                'description' => '<p>قاب سیلیکونی اصلی اپل با حلقه مغناطیسی MagSafe داخلی، امکان اتصال آسان به شارژرهای MagSafe و اکسسوری‌های مغناطیسی را فراهم می‌کند.</p>',
                'price' => 1850000,
                'compare_price' => 2200000,
                'discount_price' => 1750000,
                'stock' => 80,
                'sku' => 'APL-MGS-CLR-001',
                'category_id' => $caseCategory->id,
                'brand_id' => $apple->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'جنس' => 'سیلیکون مایع اصلی اپل',
                    'ویژگی خاص' => 'حلقه مغناطیسی MagSafe',
                    'سازگاری' => 'شارژرهای MagSafe و اکسسوری‌ها',
                    'رنگ' => 'شفاف',
                    'گارانتی' => 'گارانتی رسمی اپل',
                ],
                'device_model_ids' => [$iphone15ProMax?->id, $iphone15Pro?->id],
                'is_featured' => true,
                'is_bestseller' => true,
            ],

            // ==================== گلس محافظ صفحه (Screen Protectors) ====================
            
            [
                'name' => 'گلس اسپایگن مدل EZ Fit Tempered Glass',
                'slug' => 'spigen-ez-fit-glass',
                'short_description' => 'گلس شیشه‌ای تمپر با سختی 9H و نصب آسان',
                'description' => '<p>گلس محافظ EZ Fit با سختی 9H و پوشش اولئوفوبیک، از صفحه نمایش گوشی شما در برابر خط و خش، ضربه و اثر انگشت محافظت می‌کند. قاب نصب مخصوص، نصب دقیق و بدون حباب را تضمین می‌کند.</p>',
                'price' => 280000,
                'compare_price' => 380000,
                'stock' => 300,
                'sku' => 'SPG-EZ-GLS-001',
                'category_id' => $glassCategory->id,
                'brand_id' => $spigen->id,
                'main_image' => 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop',
                ],
                'specifications' => [
                    'جنس' => 'شیشه تمپر ژاپنی',
                    'سختی' => '9H',
                    'ضخامت' => '0.33 میلی‌متر',
                    'شفافیت' => '99%',
                    'پوشش' => 'اولئوفوبیک (ضد اثر انگشت)',
                    'تعداد در بسته' => '2 عدد + قاب نصب',
                    'نصب' => 'بدون حباب با قاب راهنما',
                ],
                'device_model_ids' => [$iphone15ProMax?->id, $iphone15Pro?->id, $iphone15?->id],
                'is_bestseller' => true,
            ],

            [
                'name' => 'گلس سرامیکی سامسونگ Galaxy S24 Ultra',
                'slug' => 'samsung-ceramic-shield-s24-ultra',
                'short_description' => 'محافظ سرامیکی اصلی سامسونگ با مقاومت فوق‌العاده',
                'description' => '<p>گلس سرامیکی اصلی سامسونگ با فناوری Ceramic Shield، مقاومتی تا 4 برابر بیشتر از شیشه‌های معمولی در برابر سقوط و ضربه ارائه می‌دهد.</p>',
                'price' => 450000,
                'compare_price' => 600000,
                'stock' => 150,
                'sku' => 'SAM-CER-S24U-001',
                'category_id' => $glassCategory->id,
                'brand_id' => $samsung->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'جنس' => 'سرامیک شیشه‌ای Ceramic Shield',
                    'سختی' => 'بالاتر از 9H',
                    'ضخامت' => '0.4 میلی‌متر',
                    'سازگاری' => 'Galaxy S24 Ultra فقط',
                    'تعداد' => '1 عدد + پارچه تمیزکننده',
                ],
                'device_model_ids' => [$galaxyS24Ultra?->id],
                'is_featured' => true,
            ],

            // ==================== شارژر و کابل (Chargers & Cables) ====================
            
            [
                'name' => 'شارژر دیواری انکر 20W مدل PowerPort III Nano',
                'slug' => 'anker-powerport-nano-20w',
                'short_description' => 'کوچک‌ترین شارژر 20W دنیا با تکنولوژی Power Delivery',
                'description' => '<p>شارژر Anker PowerPort III Nano با توان 20 وات و ابعاد بسیار جمع‌وجور، مناسب‌ترین گزینه برای شارژ سریع آیفون و سایر دستگاه‌های USB-C است. این شارژر 50% کوچکتر از شارژرهای استاندارد اپل است.</p>',
                'price' => 380000,
                'compare_price' => 520000,
                'discount_price' => 360000,
                'stock' => 250,
                'sku' => 'ANK-PP3N-20W-WH',
                'category_id' => $chargerCategory->id,
                'brand_id' => $anker->id,
                'main_image' => 'https://images.unsplash.com/photo-1583863788434-e58a36331f07?w=800&h=800&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1583863788434-e58a36331f07?w=800&h=800&fit=crop',
                    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop',
                ],
                'specifications' => [
                    'توان خروجی' => '20 وات',
                    'پورت‌ها' => '1x USB-C',
                    'ورودی' => '100-240V ~ 0.6A 50-60Hz',
                    'خروجی' => '5V=3A / 9V=2.22A / 12V=1.67A',
                    'تکنولوژی' => 'Power Delivery 3.0, PPS',
                    'ابعاد' => '27 x 27 x 30 میلی‌متر',
                    'وزن' => '30 گرم',
                    'رنگ' => 'سفید',
                    'گارانتی' => '18 ماه گارانتی رسمی انکر',
                    'ایمنی' => 'MultiProtect (محافظت در برابر نوسان، داغی، اتصال کوتاه)',
                ],
                'device_model_ids' => [], // عمومی
                'is_featured' => true,
                'is_bestseller' => true,
                'is_special_offer' => true,
            ],

            [
                'name' => 'شارژر دیواری سامسونگ 45W Super Fast Charging',
                'slug' => 'samsung-45w-super-fast-charger',
                'short_description' => 'شارژر اصلی سامسونگ با توان 45 وات برای گلکسی S24 Ultra',
                'description' => '<p>شارژر اصلی سامسونگ با پشتیبانی از Super Fast Charging 2.0 و Power Delivery 3.0، مناسب برای شارژ سریع گوشی‌های پرچمدار سامسونگ.</p>',
                'price' => 850000,
                'compare_price' => 1100000,
                'stock' => 100,
                'sku' => 'SAM-SFC-45W-BK',
                'category_id' => $chargerCategory->id,
                'brand_id' => $samsung->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'توان' => '45 وات',
                    'پورت' => 'USB-C',
                    'تکنولوژی' => 'Super Fast Charging 2.0, PD 3.0, PPS',
                    'خروجی' => '5V/3A, 9V/2.77A, 15V/2A, 25V/1.8A',
                    'طول کابل' => '1 متر (USB-C به C)',
                    'رنگ' => 'مشکی',
                ],
                'device_model_ids' => [$galaxyS24Ultra?->id, $galaxyS24?->id, $galaxyS23Ultra?->id],
                'is_featured' => true,
            ],

            [
                'name' => 'کابل شارژ انکر USB-C به Lightning 1.8 متر',
                'slug' => 'anker-usbc-lightning-cable-1.8m',
                'short_description' => 'کابل شارژ سریع با پشتیبانی از Power Delivery و روکش نایلونی',
                'description' => '<p>کابل شارژ با کیفیت بالا برای اتصال دستگاه‌های USB-C به iPhone و iPad با پشتیبانی از شارژ سریع تا 20W.</p>',
                'price' => 290000,
                'compare_price' => 420000,
                'stock' => 250,
                'sku' => 'ANK-USBC-LT-1.8',
                'category_id' => $chargerCategory->id,
                'brand_id' => $anker->id,
                'main_image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'نوع کانکتور' => 'USB-C به Lightning',
                    'طول' => '1.8 متر',
                    'توان' => 'پشتیبانی تا 20W',
                    'سرعت انتقال داده' => '480 Mbps',
                    'جنس روکش' => 'نایلون بافته شده دو لایه',
                    'رنگ' => 'مشکی',
                    'سازگاری' => 'iPhone 8 به بعد، iPad Pro',
                    'گارانتی' => '18 ماه',
                    'تحمل خمیدگی' => '25000+ بار',
                ],
                'device_model_ids' => [],
                'is_bestseller' => true,
            ],

            [
                'name' => 'کابل USB-C به USB-C بیسوس 100W 2 متر',
                'slug' => 'baseus-usbc-c-cable-100w-2m',
                'short_description' => 'کابل شارژ سریع 100W با نمایشگر دیجیتال توان',
                'description' => '<p>کابل Baseus با پشتیبانی از شارژ سریع 100W و نمایشگر دیجیتال که توان لحظه‌ای شارژ را نشان می‌دهد. مناسب برای لپ‌تاپ‌ها، تبلت‌ها و گوشی‌های هوشمند.</p>',
                'price' => 420000,
                'compare_price' => 580000,
                'stock' => 180,
                'sku' => 'BS-USBC-100W-2M',
                'category_id' => $chargerCategory->id,
                'brand_id' => $baseus->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'توان حداکثر' => '100 وات (20V/5A)',
                    'طول' => '2 متر',
                    'نمایشگر' => 'دیجیتال LED',
                    'جنس' => 'نایلون بافته شده + آلومینیوم',
                    'تراشه' => 'E-Marker Chip',
                    'سازگاری' => 'MacBook, iPad Pro, Samsung, Huawei',
                ],
                'device_model_ids' => [],
                'is_featured' => true,
            ],

            // ==================== هندزفری و هدفون (Audio) ====================
            
            [
                'name' => 'ایرپاد پرو اپل نسل 2 با کیس MagSafe',
                'slug' => 'airpods-pro-2-magsafe',
                'short_description' => 'هدفون بی‌سیم اپل با حذف نویز فعال و صدای فضایی',
                'description' => '<p>ایرپاد پرو نسل 2 با تراشه H2 اپل، حذف نویز فعال 2 برابر قوی‌تر، صدای فضایی شخصی‌سازی شده و باتری با عمر طولانی‌تر.</p>',
                'price' => 9850000,
                'compare_price' => 11500000,
                'stock' => 40,
                'sku' => 'APL-APP2-MGS-WH',
                'category_id' => $audioCategory->id,
                'brand_id' => $apple->id,
                'main_image' => 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&h=800&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&h=800&fit=crop',
                ],
                'specifications' => [
                    'نوع' => 'True Wireless Earbuds',
                    'حذف نویز' => 'Active Noise Cancellation (ANC)',
                    'تراشه' => 'Apple H2',
                    'عمر باتری' => '6 ساعت (ANC روشن)، 30 ساعت با کیس',
                    'مقاومت' => 'IPX4 (ضد آب و عرق)',
                    'شارژ' => 'Lightning, MagSafe, Qi Wireless',
                    'رنگ' => 'سفید',
                    'گارانتی' => '1 سال گارانتی رسمی',
                ],
                'device_model_ids' => [],
                'is_featured' => true,
                'is_bestseller' => true,
            ],

            [
                'name' => 'هدفون بی‌سیم انکر Soundcore Life Q30',
                'slug' => 'anker-soundcore-life-q30',
                'short_description' => 'هدفون روی گوش با حذف نویز هیبریدی و باتری 40 ساعته',
                'description' => '<p>هدفون Anker Soundcore Life Q30 با حذف نویز هیبریدی، درایورهای 40mm و باتری با عمر 40 ساعت، انتخابی عالی برای موسیقی و مکالمه.</p>',
                'price' => 2850000,
                'compare_price' => 3500000,
                'stock' => 60,
                'sku' => 'ANK-Q30-BLK',
                'category_id' => $audioCategory->id,
                'brand_id' => $anker->id,
                'main_image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'نوع' => 'Over-Ear Wireless',
                    'حذف نویز' => 'Hybrid Active Noise Cancellation',
                    'درایور' => '40mm Dynamic',
                    'عمر باتری' => '40 ساعت (ANC خاموش)، 35 ساعت (ANC روشن)',
                    'بلوتوث' => '5.0',
                    'کدک' => 'SBC, AAC',
                    'شارژ' => 'USB-C، 2 ساعت شارژ کامل',
                    'وزن' => '260 گرم',
                ],
                'device_model_ids' => [],
                'is_featured' => true,
            ],

            // ==================== پاوربانک (Power Banks) ====================
            
            [
                'name' => 'پاوربانک انکر 20000mAh مدل PowerCore Essential',
                'slug' => 'anker-powercore-20000mah',
                'short_description' => 'پاوربانک 20000 میلی‌آمپر با دو پورت USB و فناوری PowerIQ',
                'description' => '<p>پاوربانک Anker PowerCore با ظرفیت 20000 میلی‌آمپر، قابلیت شارژ همزمان دو دستگاه و فناوری PowerIQ برای تشخیص هوشمند دستگاه متصل.</p>',
                'price' => 1250000,
                'compare_price' => 1600000,
                'discount_price' => 1150000,
                'stock' => 120,
                'sku' => 'ANK-PC-20K-BK',
                'category_id' => $powerbankCategory->id,
                'brand_id' => $anker->id,
                'main_image' => 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&h=800&fit=crop',
                ],
                'specifications' => [
                    'ظرفیت' => '20000 میلی‌آمپر ساعت (72Wh)',
                    'پورت خروجی' => '2x USB-A با PowerIQ',
                    'پورت ورودی' => 'Micro-USB, USB-C',
                    'توان خروجی' => '18 وات حداکثر',
                    'زمان شارژ مجدد' => '10 ساعت با شارژر 2A',
                    'ابعاد' => '158 x 74 x 19 میلی‌متر',
                    'وزن' => '343 گرم',
                    'ایمنی' => 'MultiProtect (13 سیستم محافظتی)',
                ],
                'device_model_ids' => [],
                'is_bestseller' => true,
                'is_special_offer' => true,
            ],

            [
                'name' => 'پاوربانک بیسوس 30000mAh با نمایشگر دیجیتال',
                'slug' => 'baseus-powerbank-30000mah-display',
                'short_description' => 'پاوربانک 30000 میلی‌آمپر با نمایشگر درصد باتری و شارژ سریع 22.5W',
                'description' => '<p>پاوربانک Baseus با ظرفیت بالا، نمایشگر دیجیتال دقیق و پشتیبانی از تمام پروتکل‌های شارژ سریع.</p>',
                'price' => 1680000,
                'compare_price' => 2100000,
                'stock' => 90,
                'sku' => 'BS-PB-30K-DB',
                'category_id' => $powerbankCategory->id,
                'brand_id' => $baseus->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'ظرفیت' => '30000mAh (111Wh)',
                    'نمایشگر' => 'دیجیتال LED درصد',
                    'پورت‌ها' => '2x USB-A, 1x USB-C (ورود/خروج)',
                    'توان' => '22.5W SuperCharge',
                    'پروتکل‌ها' => 'PD3.0, QC3.0, SCP, FCP',
                    'وزن' => '560 گرم',
                ],
                'device_model_ids' => [],
                'is_featured' => true,
            ],

            // ==================== ساعت هوشمند (Smartwatches) ====================
            
            [
                'name' => 'ساعت هوشمند اپل واچ سری 9 آلومینیوم 45mm',
                'slug' => 'apple-watch-series-9-45mm',
                'short_description' => 'پیشرفته‌ترین ساعت هوشمند اپل با سنسور دمای بدن و Double Tap',
                'description' => '<p>اپل واچ سری 9 با تراشه S9 SiP، نمایشگر Always-On Retina تا 2000 نیت، سنسور دمای بدن و ویژگی جدید Double Tap برای کنترل بدون لمس.</p>',
                'price' => 18500000,
                'compare_price' => 21000000,
                'stock' => 35,
                'sku' => 'APL-AW9-45-ALM-MID',
                'category_id' => $watchCategory->id,
                'brand_id' => $apple->id,
                'main_image' => 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'اندازه' => '45 میلی‌متر',
                    'جنس بدنه' => 'آلومینیوم 100% بازیافتی',
                    'نمایشگر' => 'LTPO OLED Always-On Retina',
                    'روشنایی' => 'تا 2000 نیت',
                    'تراشه' => 'Apple S9 SiP با Neural Engine',
                    'سنسورها' => 'ECG, اکسیژن خون، دمای بدن، شتاب‌سنج',
                    'مقاومت' => '50 متر ضد آب (WR50)',
                    'باتری' => 'تا 18 ساعت正常使用',
                    'سیستم عامل' => 'watchOS 10',
                ],
                'device_model_ids' => [],
                'is_featured' => true,
                'is_bestseller' => true,
            ],

            [
                'name' => 'ساعت هوشمند سامسونگ Galaxy Watch6 Classic 47mm',
                'slug' => 'samsung-galaxy-watch6-classic-47mm',
                'short_description' => 'ساعت کلاسیک سامسونگ با حلقه چرخشی و ردیابی پیشرفته سلامتی',
                'description' => '<p>گلکسی واچ 6 کلاسیک با طراحی timeless، حلقه چرخشی فیزیکی و سنسورهای پیشرفته سلامتی، همراهی ایده‌آل برای زندگی مدرن.</p>',
                'price' => 14200000,
                'compare_price' => 16500000,
                'stock' => 45,
                'sku' => 'SAM-GW6C-47-BLK',
                'category_id' => $watchCategory->id,
                'brand_id' => $samsung->id,
                'main_image' => 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'اندازه' => '47 میلی‌متر',
                    'بدنه' => 'استیل ضد زنگ',
                    'نمایشگر' => 'Super AMOLED 1.5 اینچ',
                    'حلقه' => 'چرخشی فیزیکی (Rotating Bezel)',
                    'سنسورها' => 'ضربان قلب، ECG، فشار خون، خواب، Body Composition',
                    'مقاومت' => '5ATM + IP68 + MIL-STD-810H',
                    'باتری' => '425mAh، تا 40 ساعت',
                    'سیستم عامل' => 'Wear OS Powered by Samsung',
                ],
                'device_model_ids' => [$galaxyS24Ultra?->id, $galaxyS24?->id],
                'is_featured' => true,
            ],

            // ==================== هولدر و پایه (Holders & Stands) ====================
            
            [
                'name' => 'هولدر ماشین بیسوس مدل Magnetic Air Vent',
                'slug' => 'baseus-magnetic-car-holder-vent',
                'short_description' => 'پایه نگهدارنده مغناطیسی دریچه کولر با چرخش 360 درجه',
                'description' => '<p>هولدر مغناطیسی Baseus با 6 آهنربای N52 قدرتمند، گوشی شما را محکم نگه می‌دارد. نصب آسان روی دریچه کولر و چرخش 360 درجه برای زاویه دید دلخواه.</p>',
                'price' => 280000,
                'compare_price' => 380000,
                'stock' => 200,
                'sku' => 'BS-MAG-HOLD-BLK',
                'category_id' => $holderCategory->id,
                'brand_id' => $baseus->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'نوع' => 'مغناطیسی دریچه‌ای',
                    'آهنربا' => '6 عدد N52 Rare Earth',
                    'چرخش' => '360 درجه',
                    'سازگاری' => 'تمام گوشی‌ها تا 300 گرم',
                    'جنس' => 'آلومینیوم + ABS',
                    'رنگ' => 'مشکی',
                    'اقلام' => 'هولدر + 2 صفحه فلزی',
                ],
                'device_model_ids' => [],
                'is_bestseller' => true,
            ],

            [
                'name' => 'پایه رومیزی انکر مدل Adjustable Stand',
                'slug' => 'anker-adjustable-desktop-stand',
                'short_description' => 'پایه نگهدارنده قابل تنظیم برای گوشی و تبلت',
                'description' => '<p>پایه رومیزی Anker با زاویه قابل تنظیم، مناسب برای تماس‌های ویدیویی، تماشای فیلم و شارژ همزمان.</p>',
                'price' => 450000,
                'compare_price' => 600000,
                'stock' => 150,
                'sku' => 'ANK-STAND-ADJ-SLV',
                'category_id' => $holderCategory->id,
                'brand_id' => $anker->id,
                'main_image' => 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=800&fit=crop',
                'gallery' => [],
                'specifications' => [
                    'نوع' => 'رومیزی',
                    'زاویه' => 'قابل تنظیم 0-85 درجه',
                    'ارتفاع' => 'قابل تنظیم',
                    'سازگاری' => 'گوشی 4-8 اینچ، تبلت تا 10 اینچ',
                    'جنس' => 'آلومینیوم آلیاژی',
                    'پد ضد لغزش' => 'سیلیکونی',
                    'رنگ' => 'نقره‌ای',
                ],
                'device_model_ids' => [],
            ],

        ];

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($templates as $templateData) {
            // بررسی عدم تکرار
            $exists = Product::where('slug', $templateData['slug'])->whereNull('seller_id')->exists();
            
            if ($exists) {
                $skippedCount++;
                $this->command->info("⏭️ تمپلیت '{$templateData['name']}' از قبل وجود دارد.");
                continue;
            }

            $deviceIds = $templateData['device_model_ids'] ?? [];
            unset($templateData['device_model_ids']);

            // ایجاد محصول تمپلیت
            $product = Product::create(array_merge($templateData, [
                'seller_id' => null, 
                'is_active' => true,
                'views_count' => rand(100, 500),
                'sales_count' => rand(10, 50),
                'rating' => rand(40, 50) / 10, // 4.0 to 5.0
                'reviews_count' => rand(20, 100),
            ]));

            // اتصال به دستگاه‌ها (اگر وجود داشت)
            if (!empty($deviceIds)) {
                $product->deviceModels()->sync($deviceIds);
            }

            $createdCount++;
        }

        $this->command->info(" ");
        $this->command->info("✅ کتابخانه جامع محصولات آماده شد!");
        $this->command->info("   📦 تعداد ایجاد شده: {$createdCount} محصول");
        $this->command->info("   ⏭️ تعداد رد شده (از قبل موجود): {$skippedCount} محصول");
        $this->command->info(" ");
        $this->command->info("💡 فروشندگان حالا می‌توانند از بین {$createdCount} محصول آماده، انتخاب و به فروشگاه خود اضافه کنند!");
    }
}
