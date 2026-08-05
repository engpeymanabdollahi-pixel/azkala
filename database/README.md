# 📦 Azkala Data Seed Documentation

## ساختار فایل‌های ایجاد شده

```
workspace/
├── app/Console/Commands/
│   └── VerifySeedDataCommand.php          # دستورات بررسی سلامت داده‌ها
├── database/
│   ├── data/                              # داده‌های خام (فاز ۲)
│   │   ├── BrandsData.php                 # ۳۰+ برند جهانی و ایرانی
│   │   ├── MasterProductsCatalog.php      # کاتالوگ ۲۰۰ محصول شاخص
│   │   └── DeviceCompatibilityMap.php     # ۳۰ مدل گوشی + قوانین سازگاری
│   ├── seeders/                           # سکدرهای ماژولار (فاز ۳)
│   │   ├── MasterDataSeeder.php           # سکدر اصلی (ورودی)
│   │   ├── BrandsAndCategoriesSeeder.php  # برندها + دسته‌بندی‌ها
│   │   ├── DevicesSeeder.php              # دستگاه‌ها
│   │   └── ProductsSeeder.php             # محصولات + روابط
│   └── factories/                         # فکتوری‌ها برای تست
│       └── ProductFactory.php             # تولید داده تصادفی
```

## 🚀 نحوه اجرا

### اجرای کامل Seed
```bash
php artisan db:seed --class=MasterDataSeeder
```

### اجرای تکی هر سکدر
```bash
# فقط برندها و دسته‌بندی‌ها
php artisan db:seed --class=BrandsAndCategoriesSeeder

# فقط دستگاه‌ها
php artisan db:seed --class=DevicesSeeder

# فقط محصولات
php artisan db:seed --class=ProductsSeeder
```

### بررسی سلامت داده‌ها (فاز ۴)
```bash
php artisan azkala:verify-seeds
```

## 📊 خروجی مورد انتظار

پس از اجرای موفقیت‌آمیز `MasterDataSeeder`:

```
🚀 شروع فرآیند Seed داده‌های Azkala...
📦 در حال وارد کردن برندها و دسته‌بندی‌ها...
✅ 30 برند با موفقیت وارد/آپدیت شدند.
✅ 15 دسته‌بندی با موفقیت وارد/آپدیت شدند.
📱 در حال وارد کردن دستگاه‌ها و مدل‌های گوشی...
✅ 30 دستگاه با موفقیت وارد/آپدیت شدند.
🛍️ در حال وارد کردن محصولات از کاتالوگ...
✅ 5 محصول با موفقیت وارد/آپدیت شدند.
🔗 20 رابطه محصول-دسته‌بندی/دستگاه ایجاد شد.

📊 ==================== گزارش نهایی Seed ====================
┌─────────────────────────────┬────────────────┐
│ موجودیت                     │ تعداد رکورد    │
├─────────────────────────────┼────────────────┤
│ ✅ برندها (Brands)          │ 30             │
│ ✅ دسته‌بندی‌ها (Categories)  │ 15             │
│ ✅ محصولات (Products)        │ 5              │
│ ✅ دستگاه‌ها (Devices)       │ 30             │
│ ✅ روابط سازگاری             │ 20             │
└─────────────────────────────┴────────────────┘

🎉 عملیات Seed با موفقیت به پایان رسید!
💡 دیتابیس آماده بهره‌برداری است.
```

## 🔍 ویژگی‌های کلیدی پیاده‌سازی

### ۱. الگوی Upsert (Idempotent)
تمامی سکدرها از متد `updateOrCreate` استفاده می‌کنند تا:
- با اجرای مجدد، داده تکراری ایجاد نشود
- داده‌های موجود آپدیت شوند
- عملیات قابل تکرار باشد

### ۲. تراکنش کامل (Transaction)
`MasterDataSeeder` تمام عملیات را در یک تراکنش انجام می‌دهد:
- اگر خطایی رخ دهد، همه چیز Rollback می‌شود
- دیتابیس هرگز در وضعیت نیمه‌کاره نمی‌ماند

### ۳. ساختار JSON برای Attributes
مشخصات فنی محصولات در فیلد JSON ذخیره می‌شوند:
```json
{
  "capacity": "10000mAh",
  "input": "5V/2A",
  "output": "5V/2.4A",
  "weight": "180g",
  "material": "Premium Plastic",
  "features": ["PowerIQ", "MultiProtect"]
}
```

### ۴. روابط Many-to-Many
- **Product ↔ Category**: هر محصول می‌تواند در چند دسته باشد
- **Product ↔ Device**: هر محصول با چند دستگاه سازگار است

### ۵. منطق Device-First
سیستم به صورت هوشمند محصولات را به دستگاه‌های مرتبط متصل می‌کند:
- قاب‌ها → بر اساس مدل ذکر شده در نام محصول
- کابل‌ها/شارژرها → بر اساس نوع پورت (USB-C, Lightning)

## 📝 نمونه کوئری‌های کاربردی

### دریافت تمام قاب‌های سازگار با iPhone 15 Pro Max
```php
use App\Models\Product;
use App\Models\Device;

$device = Device::where('slug', 'iphone-15-pro-max')->first();

$compatibleCases = Product::whereHas('devices', function($q) use ($device) {
        $q->where('id', $device->id);
    })
    ->whereHas('categories', function($q) {
        $q->where('slug', 'like', '%cases%');
    })
    ->get();
```

### دریافت محصولات یک برند خاص
```php
use App\Models\Brand;

$brand = Brand::where('slug', 'anker')->first();
$products = $brand->products()->where('is_active', true)->get();
```

### فیلتر محصولات بر اساس مشخصات فنی (JSON Query)
```php
// محصولات با ظرفیت بالای 10000mAh
$products = Product::whereJsonContains('attributes->capacity', '20000')
    ->orWhereJsonContains('attributes->capacity', '30000')
    ->get();
```

## 🧪 تست با Factory

برای تولید داده تصادفی جهت تست:
```php
use App\Models\Product;

// تولید 50 محصول تصادفی
Product::factory()->count(50)->create();

// تولید محصول ویژه
Product::factory()->featured()->create();

// تولید محصول با موجودی کم
Product::factory()->lowStock()->create();
```

## ⚠️ نکات مهم

1. **ترتیب اجرا**: حتماً از `MasterDataSeeder` استفاده کنید تا ترتیب صحیح رعایت شود
2. **Foreign Keys**: جداول باید Migrationهای لازم را داشته باشند
3. **Models**: مدل‌های `Brand`, `Category`, `Product`, `Device` باید وجود داشته باشند
4. **Images**: تصاویر از Unsplash بارگذاری می‌شوند - اطمینان حاصل کنید سرور به اینترنت دسترسی دارد

## 🔧 توسعه بیشتر

برای افزودن محصولات بیشتر:
1. آرایه جدید به `MasterProductsCatalog::getProducts()` اضافه کنید
2. اسکریت را مجدداً اجرا کنید (`php artisan db:seed`)
3. سیستم به صورت خودکار محصولات جدید را اضافه می‌کند

---
**تیم توسعه بک‌اند Azkala**  
*نسخه 1.0 - فاز ۲، ۳، ۴*
