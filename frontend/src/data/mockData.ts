import type { Brand, PhoneSeries, PhoneModel, Product, Category, Seller } from '@/types/models';

// ==================== Brands ====================

export const mockBrands: Brand[] = [
  {
    id: 1, name: 'Apple', slug: 'apple',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 4, models_count: 18,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 2, name: 'Samsung', slug: 'samsung',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 5, models_count: 32,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 3, name: 'Xiaomi', slug: 'xiaomi',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 6, models_count: 40,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 4, name: 'Huawei', slug: 'huawei',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 4, models_count: 24,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 5, name: 'Google', slug: 'google',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 2, models_count: 10,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 6, name: 'OnePlus', slug: 'oneplus',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 3, models_count: 15,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 7, name: 'Oppo', slug: 'oppo',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 4, models_count: 20,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 8, name: 'Nokia', slug: 'nokia',
    logo: '/images/placeholder.svg',
    is_active: true, series_count: 3, models_count: 12,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
];

// ==================== Series ====================

export const mockSeries: PhoneSeries[] = [
  { id: 1, brand_id: 1, name: 'iPhone 15', slug: 'iphone-15', models_count: 4, image: '/images/placeholder.svg', brand: mockBrands[0], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, brand_id: 1, name: 'iPhone 14', slug: 'iphone-14', models_count: 4, image: '/images/placeholder.svg', brand: mockBrands[0], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 3, brand_id: 1, name: 'iPhone 13', slug: 'iphone-13', models_count: 4, image: '/images/placeholder.svg', brand: mockBrands[0], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 4, brand_id: 2, name: 'Galaxy S24', slug: 'galaxy-s24', models_count: 3, image: '/images/placeholder.svg', brand: mockBrands[1], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 5, brand_id: 2, name: 'Galaxy S23', slug: 'galaxy-s23', models_count: 3, image: '/images/placeholder.svg', brand: mockBrands[1], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 6, brand_id: 2, name: 'Galaxy A55', slug: 'galaxy-a55', models_count: 1, image: '/images/placeholder.svg', brand: mockBrands[1], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 7, brand_id: 3, name: 'Xiaomi 14', slug: 'xiaomi-14', models_count: 3, image: '/images/placeholder.svg', brand: mockBrands[2], created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 8, brand_id: 3, name: 'Redmi Note 13', slug: 'redmi-note-13', models_count: 4, image: '/images/placeholder.svg', brand: mockBrands[2], created_at: '2024-01-01', updated_at: '2024-01-01' },
];

// ==================== Models ====================

export const mockModels: PhoneModel[] = [
  {
    id: 1, series_id: 1, brand_id: 1,
    name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max',
    image: '/images/placeholder.svg',
    release_year: 2023, is_active: true,
    compatible_products_count: 45,
    brand: mockBrands[0], series: mockSeries[0],
    specs: { screen_size: '6.7 اینچ', weight: '221 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 2, series_id: 1, brand_id: 1,
    name: 'iPhone 15 Pro', slug: 'iphone-15-pro',
    image: '/images/placeholder.svg',
    release_year: 2023, is_active: true,
    compatible_products_count: 40,
    brand: mockBrands[0], series: mockSeries[0],
    specs: { screen_size: '6.1 اینچ', weight: '187 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 3, series_id: 1, brand_id: 1,
    name: 'iPhone 15 Plus', slug: 'iphone-15-plus',
    image: '/images/placeholder.svg',
    release_year: 2023, is_active: true,
    compatible_products_count: 38,
    brand: mockBrands[0], series: mockSeries[0],
    specs: { screen_size: '6.7 اینچ', weight: '201 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 4, series_id: 1, brand_id: 1,
    name: 'iPhone 15', slug: 'iphone-15',
    image: '/images/placeholder.svg',
    release_year: 2023, is_active: true,
    compatible_products_count: 42,
    brand: mockBrands[0], series: mockSeries[0],
    specs: { screen_size: '6.1 اینچ', weight: '171 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 5, series_id: 2, brand_id: 1,
    name: 'iPhone 14 Pro Max', slug: 'iphone-14-pro-max',
    image: '/images/placeholder.svg',
    release_year: 2022, is_active: true,
    compatible_products_count: 55,
    brand: mockBrands[0], series: mockSeries[1],
    specs: { screen_size: '6.7 اینچ', weight: '240 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 6, series_id: 4, brand_id: 2,
    name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra',
    image: '/images/placeholder.svg',
    release_year: 2024, is_active: true,
    compatible_products_count: 35,
    brand: mockBrands[1], series: mockSeries[3],
    specs: { screen_size: '6.8 اینچ', weight: '232 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 7, series_id: 4, brand_id: 2,
    name: 'Galaxy S24+', slug: 'galaxy-s24-plus',
    image: '/images/placeholder.svg',
    release_year: 2024, is_active: true,
    compatible_products_count: 30,
    brand: mockBrands[1], series: mockSeries[3],
    specs: { screen_size: '6.7 اینچ', weight: '196 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 8, series_id: 4, brand_id: 2,
    name: 'Galaxy S24', slug: 'galaxy-s24',
    image: '/images/placeholder.svg',
    release_year: 2024, is_active: true,
    compatible_products_count: 28,
    brand: mockBrands[1], series: mockSeries[3],
    specs: { screen_size: '6.2 اینچ', weight: '167 گرم' },
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
];

// ==================== Sellers ====================

export const mockSellers: Seller[] = [
  {
    id: 1, user_id: 10, shop_name: 'موبایل پلاس', slug: 'mobile-plus',
    status: 'active', health_score: 95, rating: 4.8, reviews_count: 320,
    products_count: 45, orders_count: 1250,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 2, user_id: 11, shop_name: 'گجت لند', slug: 'gadget-land',
    status: 'active', health_score: 88, rating: 4.5, reviews_count: 180,
    products_count: 38, orders_count: 890,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 3, user_id: 12, shop_name: 'دیجیتال شاپ', slug: 'digital-shop',
    status: 'active', health_score: 92, rating: 4.7, reviews_count: 250,
    products_count: 62, orders_count: 1800,
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
];

// ==================== Categories ====================

export const mockCategories: Category[] = [
  { id: 1, parent_id: null, name: 'قاب گوشی', slug: 'phone-case', icon: '📱', type: 'mobile_accessory', is_active: true, products_count: 450, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, parent_id: null, name: 'شارژر', slug: 'charger', icon: '🔌', type: 'mobile_accessory', is_active: true, products_count: 180, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 3, parent_id: null, name: 'هندزفری و هدفون', slug: 'headphone', icon: '🎧', type: 'mobile_accessory', is_active: true, products_count: 230, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 4, parent_id: null, name: 'گلس محافظ', slug: 'screen-protector', icon: '🛡️', type: 'mobile_accessory', is_active: true, products_count: 320, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 5, parent_id: null, name: 'پاوربانک', slug: 'powerbank', icon: '🔋', type: 'mobile_accessory', is_active: true, products_count: 95, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 6, parent_id: null, name: 'کابل و مبدل', slug: 'cable', icon: '🔗', type: 'mobile_accessory', is_active: true, products_count: 210, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

// ==================== Products ====================
// ✅ Slug ها با دیتابیس sync شده‌اند

export const mockProducts: Product[] = [
  {
    id: 1, seller_id: 1, category_id: 1,
    name: 'Silicone Case Samsung Galaxy S24',
    slug: 'silicone-case-samsung-galaxy-s24-1', // ✅ Sync با دیتابیس
    description: 'قاب سیلیکونی با کیفیت بالا مناسب برای سامسونگ گلکسی S24. ضخامت مناسب، گریپ عالی و محافظت در برابر ضربه.',
    short_description: 'قاب سیلیکونی با کیفیت اصل',
    price: 250000, compare_price: 199000,
    stock: 50, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.7, reviews_count: 128,
    discount_percentage: 20,
    sales_count: 340,
    compatible_models: [mockModels[5], mockModels[6], mockModels[7]],
    seller: mockSellers[0],
    category: mockCategories[0],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 2, seller_id: 2, category_id: 4,
    name: 'Full Glue Glass iPhone 15 Pro',
    slug: 'full-glue-glass-iphone-15-pro-2', // ✅ Sync با دیتابیس
    description: 'گلس محافظ با کیفیت بالا، ضد اثر انگشت و ضد خش مناسب برای آیفون ۱۵ پرو.',
    short_description: 'گلس تمام چسب 9D',
    price: 180000, compare_price: 149000,
    stock: 100, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.5, reviews_count: 95,
    discount_percentage: 17,
    sales_count: 280,
    compatible_models: [mockModels[1]],
    seller: mockSellers[1],
    category: mockCategories[3],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 3, seller_id: 3, category_id: 2,
    name: 'Anker 65W Fast Charger',
    slug: 'anker-65w-fast-charger-3', // ✅ Sync با دیتابیس
    description: 'شارژر سریع ۶۵ وات Anker با تکنولوژی PowerIQ 3.0',
    short_description: 'شارژر سریع ۶۵ وات',
    price: 850000, compare_price: 749000,
    stock: 30, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.8, reviews_count: 210,
    discount_percentage: 12,
    sales_count: 520,
    compatible_models: [], // شارژر با همه گوشی‌ها سازگار است
    seller: mockSellers[2],
    category: mockCategories[1],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 4, seller_id: 1, category_id: 3,
    name: 'AirPods Pro 2',
    slug: 'airpods-pro-2-4', // ✅ Sync با دیتابیس
    description: 'ایرپاد پرو نسل دوم با حذف نویز فعال و کیفیت صدای بی‌نظیر',
    short_description: 'ایرپاد پرو نسل دوم',
    price: 9500000, compare_price: 8900000,
    stock: 20, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.9, reviews_count: 315,
    discount_percentage: 6,
    sales_count: 720,
    compatible_models: [mockModels[0], mockModels[1], mockModels[2], mockModels[3], mockModels[4]],
    seller: mockSellers[0],
    category: mockCategories[2],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 5, seller_id: 2, category_id: 5,
    name: 'Xiaomi 20000mAh Power Bank',
    slug: 'xiaomi-20000mah-power-bank-5', // ✅ Sync با دیتابیس
    description: 'پاوربانک با ظرفیت ۲۰۰۰۰ میلی‌آمپر و پشتیبانی از شارژ سریع',
    short_description: 'پاوربانک ۲۰۰۰۰ میلی‌آمپر',
    price: 1200000, compare_price: 999000,
    stock: 40, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.6, reviews_count: 43,
    discount_percentage: 17,
    sales_count: 98,
    compatible_models: [], // پاوربانک با همه گوشی‌ها سازگار است
    seller: mockSellers[1],
    category: mockCategories[4],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 6, seller_id: 3, category_id: 6,
    name: 'Baseus Type-C Cable 100W',
    slug: 'baseus-type-c-cable-100w-6', // ✅ Sync با دیتابیس
    description: 'کابل Type-C با پشتیبانی از شارژ سریع ۱۰۰ وات',
    short_description: 'کابل تایپ سی ۱۰۰ وات',
    price: 320000, compare_price: 0,
    stock: 75, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.4, reviews_count: 88,
    discount_percentage: 0,
    sales_count: 195,
    compatible_models: [], // کابل با همه گوشی‌ها سازگار است
    seller: mockSellers[2],
    category: mockCategories[5],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 7, seller_id: 1, category_id: 1,
    name: 'Samsung Galaxy Watch 6',
    slug: 'samsung-galaxy-watch-6-7', // ✅ Sync با دیتابیس
    description: 'ساعت هوشمند سامسونگ با قابلیت‌های پیشرفته سلامت',
    short_description: 'ساعت هوشمند سامسونگ',
    price: 12500000, compare_price: 11900000,
    stock: 15, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.7, reviews_count: 67,
    discount_percentage: 5,
    sales_count: 145,
    compatible_models: [], // ساعت مستقل است
    seller: mockSellers[0],
    category: mockCategories[0],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 8, seller_id: 2, category_id: 1,
    name: 'Magnetic Car Holder',
    slug: 'magnetic-car-holder-8', // ✅ Sync با دیتابیس
    description: 'هولدر مغناطیسی ماشین با قدرت چسبندگی بالا',
    short_description: 'هولدر مغناطیسی ماشین',
    price: 180000, compare_price: 0,
    stock: 60, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.3, reviews_count: 52,
    discount_percentage: 0,
    sales_count: 168,
    compatible_models: [], // هولدر با همه گوشی‌ها سازگار است
    seller: mockSellers[1],
    category: mockCategories[0],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 9, seller_id: 3, category_id: 1,
    name: 'Leather Case Huawei P60 Pro',
    slug: 'leather-case-huawei-p60-pro-9', // ✅ Sync با دیتابیس
    description: 'قاب چرمی لوکس با کیفیت بالا برای هواوی P60 Pro',
    short_description: 'قاب چرمی لوکس',
    price: 450000, compare_price: 380000,
    stock: 25, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.8, reviews_count: 34,
    discount_percentage: 16,
    sales_count: 89,
    compatible_models: [], // مدل هواوی در mockModels نیست
    seller: mockSellers[2],
    category: mockCategories[0],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
  {
    id: 10, seller_id: 1, category_id: 3,
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5-headphones-10', // ✅ Sync با دیتابیس
    description: 'هدفون بی‌سیم سونی با بهترین حذف نویز در بازار',
    short_description: 'هدفون بی‌سیم سونی',
    price: 18500000, compare_price: 0,
    stock: 10, status: 'active',
    images: ['/images/placeholder.svg'],
    main_image: '/images/placeholder.svg',
    rating: 4.9, reviews_count: 210,
    discount_percentage: 0,
    sales_count: 520,
    compatible_models: [], // هدفون مستقل است
    seller: mockSellers[0],
    category: mockCategories[2],
    created_at: '2024-01-01', updated_at: '2024-01-01',
  },
];

// Get products by model ID
export function getProductsByModelId(modelId: number): Product[] {
  return mockProducts.filter(product =>
    product.compatible_models?.some(model => model.id === modelId)
  );
}

// Get series by brand ID
export function getSeriesByBrandId(brandId: number): PhoneSeries[] {
  return mockSeries.filter(s => s.brand_id === brandId);
}

// Get models by series ID
export function getModelsBySeriesId(seriesId: number): PhoneModel[] {
  return mockModels.filter(m => m.series_id === seriesId);
}