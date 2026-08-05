# راهنمای اجرای Seed دیتابیس Azkala

## ساختار فایل‌های ایجاد شده

```
database/
├── factories/
│   └── ProductFactory.php              # Factory برای تولید داده‌های تستی
├── seeders/
│   ├── MasterDataSeeder.php            # سکدر اصلی (ورودی)
│   ├── BrandsAndCategoriesSeeder.php   # تزریق برندها و دسته‌بندی‌ها
│   ├── DevicesSeeder.php               # تزریق دستگاه‌های موبایل
│   ├── ProductsSeeder.php              # تزریق محصولات
│   ├── DatabaseHealthCheckSeeder.php   # بررسی سلامت دیتابیس
│   └── Data/
│       ├── BrandsData.php              # داده‌های خام برندها
│       ├── MasterProductsCatalog.php   # کاتالوگ محصولات
│       └── DeviceCompatibilityMap.php  # نقشه سازگاری دستگاه‌ها
```

## دستورالعمل اجرا

### مرحله ۱: اجرای مهاجرت‌ها (Migrations)
```bash
php artisan migrate
```

### مرحله ۲: اجرای Seed اصلی
```bash
php artisan db:seed --class=MasterDataSeeder
```

یا اگر می‌خواهید همه seedها را اجرا کنید:
```bash
php artisan db:seed
```

### مرحله ۳: بررسی سلامت دیتابیس
```bash
php artisan db:seed --class=DatabaseHealthCheckSeeder
```

## خروجی مورد انتظار

پس از اجرای موفق، گزارش زیر را مشاهده خواهید کرد:

```
🚀 Starting Azkala Master Data Seeding...
📦 Seeding Brands and Categories...
  ✓ Brands seeded: 20
  ✓ Categories seeded: 15
📱 Seeding Devices...
  ✓ Devices seeded: 24
🛍️ Seeding Products...
  ✓ Products seeded: 200
  ✓ Device-Product relationships: 15

============================================================
📊 AZKALA DATA SEEDING REPORT
============================================================
✅ Brands Imported: 20
✅ Active Categories: 15
✅ Total Products: 200
✅ Registered Devices: 24
✅ Device-Product Relationships: 15
============================================================
✨ Seeding completed successfully!
============================================================
```

## ویژگی‌های کلیدی

### ۱. Idempotent (بدون تکرار)
- تمام سکدرها از `updateOrCreate` استفاده می‌کنند
- با اجرای مجدد، داده‌ها تکراری نمی‌شوند
- فقط داده‌های موجود آپدیت می‌شوند

### ۲. Transaction Support
- تمام عملیات در یک تراکنش انجام می‌شود
- در صورت خطا، همه تغییرات rollback می‌شوند
- از نیمه‌کاره ماندن داده‌ها جلوگیری می‌شود

### ۳. JSON Fields
- فیلد `technical_specs` به صورت JSON ذخیره می‌شود
- قابلیت فیلترینگ و کوئری در Laravel
- ساختار منعطف برای ویژگی‌های مختلف محصول

### ۴. Device-First Compatibility
- سیستم سازگاری محصول با دستگاه
- جدول واسط `device_product`
- قابلیت جستجوی محصولات بر اساس دستگاه

## کوئری نمونه: محصولات سازگار با iPhone 15 Pro Max

```php
use App\Models\Device;
use App\Models\Product;

$device = Device::where('slug', 'iphone-15-pro-max')->first();

$compatibleProducts = Product::whereHas('devices', function($query) use ($device) {
    $query->where('devices.id', $device->id);
})
->whereHas('category', function($query) {
    $query->whereIn('slug', ['phone-cases', 'screen-protectors']);
})
->get();
```

## داده‌های شامل

### برندها (20+)
- Apple, Samsung, Xiaomi, Anker
- Spigen, OtterBox, Baseus, Ugreen
- Sony, JBL, Sennheiser, Bose
- و برندهای ایرانی: باور، گرین‌لاین

### دستگاه‌ها (24+)
- iPhone 13-16 series
- Galaxy S22-S24 series
- Xiaomi 13-14 series
- Google Pixel, OnePlus, Nothing

### محصولات (200+)
- ۵ محصول نمونه با جزئیات کامل
- ۱۹۵ محصول تولید شده با الگو
- دسته‌بندی‌های متنوع
- مشخصات فنی JSON
- تصاویر Unsplash/Picsum

## عیب‌یابی

### خطای Foreign Key Constraint
اطمینان حاصل کنید که migrations به درستی اجرا شده‌اند:
```bash
php artisan migrate:status
```

### داده‌های تکراری
از idempotent بودن سکدرها اطمینان حاصل کنید. اگر داده تکراری دیدید:
```bash
php artisan db:wipe
php artisan migrate --seed
```

### خطای JSON
بررسی اعتبار JSON در technical_specs:
```bash
php artisan db:seed --class=DatabaseHealthCheckSeeder
```
