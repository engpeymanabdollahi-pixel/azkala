<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\User;
use App\Models\DeviceModel;

/**
 * 📦 محصولات جدید لوازم‌جانبی موبایل — مکمل ProductSeeder / AddMissingProductsSeeder.
 * هر محصول به دسته/برند/فروشنده‌ی واقعیِ موجود متصل می‌شود و در صورت وجود
 * اسلاگ تکراری، رد می‌شود (ایدم‌پوتنت).
 */
class AdditionalProductsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📦 در حال افزودن محصولات جدید...');

        $sellers = User::where('role', 'seller')->get();
        $deviceModels = DeviceModel::all();

        $brandOf = function (string $name) {
            return Brand::where('name', $name)->first()?->id;
        };

        $products = [
            [
                'name' => 'پاوربانک شیائومی 10000mAh نسل 4',
                'category_id' => 23, 'brand_id' => $brandOf('Xiaomi'),
                'price' => 999000, 'compare_price' => 1200000, 'discount_price' => 799000,
                'stock' => 45, 'is_featured' => true, 'is_bestseller' => true,
                'sku' => 'AZK-20001',
                'short_description' => 'پاوربانک سبک و خوش‌دست با خروجی 22.5 وات و ورودی USB-C',
                'description' => 'پاوربانک شیائومی 10000mAh نسل 4 با طراحی باریک و سبک، مناسب شارژ روزانه‌ی گوشی. خروجی 22.5 وات، ورودی USB-C و پشتیبانی از شارژ سریع — انتخاب ایده‌آل برای همراه داشتن در سفر.',
                'specifications' => ['ظرفیت' => '10000mAh', 'خروجی' => '22.5W', 'ورودی' => 'USB-C', 'وزن' => '245 گرم'],
            ],
            [
                'name' => 'شارژر فندکی بیسوس 45W دو پورت',
                'category_id' => 13, 'brand_id' => $brandOf('Baseus'),
                'price' => 680000, 'stock' => 35, 'is_special_offer' => true,
                'sku' => 'AZK-20002',
                'short_description' => 'شارژر ماشین فست‌شارژ با دو پورت USB-C و USB-A',
                'description' => 'شارژر فندکی بیسوس با توان 45 وات و دو پورت هم‌زمان؛ پشتیبانی از پروتکل‌های PD و QC برای شارژ سریع گوشی و تبلت داخل خودرو.',
                'specifications' => ['توان' => '45W', 'پورت‌ها' => 'USB-C + USB-A', 'پروتکل' => 'PD 3.0 / QC 3.0'],
            ],
            [
                'name' => 'کابل USB-C به USB-C سامسونگ 2 متر',
                'category_id' => 15, 'brand_id' => $brandOf('Samsung'),
                'price' => 340000, 'stock' => 80,
                'sku' => 'AZK-20003',
                'short_description' => 'کابل مقاوم 2 متری با پشتیبانی از شارژ سریع 45 وات',
                'description' => 'کابل اورجینال سامسونگ به طول 2 متر، بافته‌شده و مقاوم در برابر گره و پارگی؛ پشتیبانی کامل از شارژ سریع Super Fast Charging تا 45 وات.',
                'specifications' => ['طول' => '2 متر', 'توان' => '45W', 'جنس' => 'نایلون بافته‌شده'],
            ],
            [
                'name' => 'هندزفری بلوتوثی سامسونگ Galaxy Buds FE',
                'category_id' => 18, 'brand_id' => $brandOf('Samsung'),
                'price' => 3500000, 'compare_price' => 4200000, 'discount_price' => 2990000,
                'stock' => 25, 'is_featured' => true,
                'sku' => 'AZK-20004',
                'short_description' => 'هدفون بی‌سیم با نویزگیر فعال و صدای قدرتمند',
                'description' => 'Galaxy Buds FE با نویزکنسلینگ فعال (ANC)، طراحی ارگونومیک و 6 ساعت پخش با یک بار شارژ — همراه با کیس شارژ بی‌سیم.',
                'specifications' => ['باتری' => '6 ساعت + 21 ساعت با کیس', 'ANC' => 'بله', 'بلوتوث' => '5.2'],
            ],
            [
                'name' => 'اپل واچ اولترا 2',
                'category_id' => 27, 'brand_id' => $brandOf('Apple'),
                'price' => 45200000, 'compare_price' => 48900000, 'discount_price' => 42900000,
                'stock' => 8, 'is_featured' => true,
                'sku' => 'AZK-20005',
                'short_description' => 'ساعت هوشمند مقاوم تیتانیومی با GPS دوفرکانسه و باتری 36 ساعته',
                'description' => 'اپل واچ اولترا 2 با بدنه‌ی تیتانیومی، صفحه‌ی 3000 نیت، GPS دوفرکانسه و مقاومت در برابر غواصی تا 100 متر — ساخته‌شده برای ماجراجویی.',
                'specifications' => ['جنس بدنه' => 'تیتانیوم', 'باتری' => 'تا 36 ساعت', 'مقاومت' => 'WR100'],
            ],
            [
                'name' => 'شیائومی می بند 9',
                'category_id' => 29, 'brand_id' => $brandOf('Xiaomi'),
                'price' => 2950000, 'compare_price' => 3300000, 'discount_price' => 2650000,
                'stock' => 30, 'is_special_offer' => true,
                'sku' => 'AZK-20006',
                'short_description' => 'دستبند هوشمند با نمایشگر AMOLED و 150+ حالت ورزشی',
                'description' => 'می بند 9 با نمایشگر 1.62 اینچی AMOLED روشن، پایش خواب و ضربان قلب ۲۴ ساعته و 150+ حالت ورزشی — سبک‌ترین همراه سلامتی شما.',
                'specifications' => ['نمایشگر' => '1.62" AMOLED', 'باتری' => 'تا 21 روز', 'مقاومت' => '5ATM'],
            ],
            [
                'name' => 'هولدر رومیزی فنردار نیلکین',
                'category_id' => 32, 'brand_id' => $brandOf('Nillkin'),
                'price' => 260000, 'stock' => 60,
                'sku' => 'AZK-20007',
                'short_description' => 'پایه‌ی رومیزی قابل تنظیم برای موبایل و تبلت',
                'description' => 'هولدر رومیزی فنردار نیلکین با بازوی قابل تنظیم در چند زاویه؛ مناسب تماشای فیلم، تماس تصویری و استفاده‌ی روزانه پشت میز.',
                'specifications' => ['سازگاری' => '4 تا 10 اینچ', 'زاویه' => 'قابل تنظیم', 'جنس' => 'آلومینیوم + سیلیکون'],
            ],
            [
                'name' => 'پایه دوربین سه‌پایه 1.6 متری بیسوس',
                'category_id' => 33, 'brand_id' => $brandOf('Baseus'),
                'price' => 890000, 'compare_price' => 990000, 'discount_price' => 790000,
                'stock' => 15, 'is_special_offer' => true,
                'sku' => 'AZK-20008',
                'short_description' => 'سه‌پایه‌ی سبک با بلوتوث و ریموت شاتر برای موبایل',
                'description' => 'سه‌پایه‌ی بیسوس با ارتفاع تا 1.6 متر، بدنه‌ی آلومینیومی سبک و ریموت بلوتوثی — برای ویدیو، عکاسی و لایو استریم.',
                'specifications' => ['حداکثر ارتفاع' => '1.6 متر', 'وزن' => '430 گرم', 'ریموت' => 'بلوتوث 5.0'],
            ],
            [
                'name' => 'باتری اورجینال سامسونگ گلکسی S20',
                'category_id' => 36, 'brand_id' => $brandOf('Samsung'),
                'price' => 780000, 'stock' => 40,
                'sku' => 'AZK-20009',
                'short_description' => 'باتری 4000mAh اورجینال برای تعمیرکاران و تعویض',
                'description' => 'باتری 4000 میلی‌آمپرساعت اورجینال برای گلکسی S20 — مناسب تعمیرگاه‌های موبایل و تعویض توسط تکنسین.',
                'specifications' => ['ظرفیت' => '4000mAh', 'سازگاری' => 'Galaxy S20', 'نوع' => 'Li-Polymer'],
            ],
            [
                'name' => 'گلس مات نیلکین گلکسی A55',
                'category_id' => 10, 'brand_id' => $brandOf('Nillkin'),
                'price' => 230000, 'stock' => 90,
                'sku' => 'AZK-20010',
                'short_description' => 'محافظ صفحه‌ی مات ضدخش با روکش اولئوفوبیک',
                'description' => 'گلس مات نیلکین با روکش اولئوفوبیک، کاهش بازتاب نور و محافظت کامل در برابر خط و خش برای گلکسی A55.',
                'specifications' => ['نوع' => 'مات', 'ضخامت' => '0.33mm', 'سازگاری' => 'Galaxy A55'],
            ],
            [
                'name' => 'شارژر بی‌سیم انکر MagGo 15W',
                'category_id' => 16, 'brand_id' => $brandOf('Anker'),
                'price' => 1690000, 'compare_price' => 1900000, 'discount_price' => 1490000,
                'stock' => 20, 'is_special_offer' => true,
                'sku' => 'AZK-20011',
                'short_description' => 'پد شارژ بی‌سیم 15 وات با چسبندگی مغناطیسی',
                'description' => 'شارژر بی‌سیم انکر MagGo با توان 15 وات، چسبندگی مغناطیسی برای گوشی‌های MagSafe و طراحی باریک — شارژ بدون کابل، سریع و راحت.',
                'specifications' => ['توان' => '15W', 'استاندارد' => 'Qi / MagSafe', 'خروجی' => 'USB-C'],
            ],
            [
                'name' => 'پاوربانک انکر 20000mAh فست‌شارژ 22.5W',
                'category_id' => 24, 'brand_id' => $brandOf('Anker'),
                'price' => 2150000, 'compare_price' => 2400000, 'discount_price' => 1890000,
                'stock' => 28, 'is_bestseller' => true,
                'sku' => 'AZK-20012',
                'short_description' => 'پاوربانک پرظرفیت با دو خروجی و نمایشگر دیجیتال',
                'description' => 'پاوربانک انکر 20000mAh با خروجی 22.5 وات، دو پورت USB و نمایشگر دیجیتال درصد شارژ — شارژ هم‌زمان دو دستگاه در سفرهای طولانی.',
                'specifications' => ['ظرفیت' => '20000mAh', 'خروجی' => '22.5W', 'پورت‌ها' => 'USB-C + USB-A', 'نمایشگر' => 'دیجیتال'],
            ],
            [
                'name' => 'هندزفری سیمی سامسونگ AKG Type-C',
                'category_id' => 21, 'brand_id' => $brandOf('Samsung'),
                'price' => 690000, 'stock' => 50,
                'sku' => 'AZK-20013',
                'short_description' => 'هندزفری سیمی AKG با کیفیت صدای استودیویی',
                'description' => 'هندزفری سیمی AKG سامسونگ با درایور 3.5 میلی‌متری، میکروفون داخلی و اتصال Type-C — صدای شفاف و باس عمیق برای مکالمه و موسیقی.',
                'specifications' => ['اتصال' => 'USB-C', 'درایور' => '3.5mm', 'میکروفون' => 'بله'],
            ],
            [
                'name' => 'ساعت هوشمند سامسونگ گلکسی واچ 6 کلاسیک 47mm',
                'category_id' => 28, 'brand_id' => $brandOf('Samsung'),
                'price' => 14900000, 'compare_price' => 16500000, 'discount_price' => 13900000,
                'stock' => 12, 'is_featured' => true,
                'sku' => 'AZK-20014',
                'short_description' => 'ساعت هوشمند با قاب چرخان، ECG و نمایشگر Super AMOLED',
                'description' => 'گلکسی واچ 6 کلاسیک با قاب چرخان فیزیکی، حسگرهای ECG و فشارخون، نمایشگر Super AMOLED و بدنه‌ی استیل ضدزنگ — ترکیب کلاسیک با هوش مدرن.',
                'specifications' => ['سایز' => '47mm', 'نمایشگر' => 'Super AMOLED', 'حسگر' => 'ECG + BioActive', 'بدنه' => 'استیل ضدزنگ'],
            ],
        ];

        $created = 0;

        foreach ($products as $productData) {
            $slug = Str::slug($productData['name'], '-');

            if (Product::where('slug', $slug)->exists()) {
                continue;
            }

            $isSpecial = $productData['is_special_offer'] ?? false;

            Product::create([
                'category_id' => $productData['category_id'],
                'brand_id' => $productData['brand_id'],
                'seller_id' => $sellers->isNotEmpty()
                    ? $sellers->get($created % $sellers->count())->id
                    : null,
                'device_model_id' => $deviceModels->isNotEmpty()
                    ? $deviceModels->random()->id
                    : null,
                'name' => $productData['name'],
                'slug' => $slug,
                'short_description' => $productData['short_description'],
                'description' => $productData['description'],
                'price' => $productData['price'],
                'compare_price' => $productData['compare_price'] ?? null,
                'discount_price' => $productData['discount_price'] ?? null,
                'stock' => $productData['stock'],
                'sku' => $productData['sku'],
                'is_active' => true,
                'is_featured' => $productData['is_featured'] ?? false,
                'is_bestseller' => $productData['is_bestseller'] ?? false,
                'is_special_offer' => $isSpecial,
                'special_offer_ends_at' => $isSpecial ? now()->addDays(7) : null,
                'specifications' => $productData['specifications'] ?? [],
            ]);

            $created++;
        }

        $this->command->info("✅ {$created} محصول جدید اضافه شد.");
    }
}
