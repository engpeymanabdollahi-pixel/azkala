import type { Product, Category, Brand, PhoneModel, Seller } from '@/types/models';

// ✅ تعریف دقیق ساختار پاسخ API
interface ApiProductResponse {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  compare_price?: string | number | null;
  discount_price?: string | number | null;
  discount_percentage?: string | number | null;
  main_image?: string;
  images?: string[];
  is_active?: boolean;
  stock?: number;
  sku?: string;
  description?: string;
  short_description?: string;
  specifications?: Record<string, unknown>;
  rating?: string | number;
  reviews_count?: number;
  views_count?: number;
  sales_count?: number;
  seller_id?: number;
  category_id?: number;
  brand_id?: number;
  created_at?: string;
  updated_at?: string;
  // ✅ دقیقاً همان چیزی که ProductResource::compatible_models واقعاً
  // برمی‌گرداند (id, name, slug, brand: {id, name} | null) — نه بیشتر.
  compatible_models?: Array<{
    id: number;
    brand?: { id: number; name: string };
    name: string;
    slug?: string;
  }>;
  brand?: {
    id: number;
    name: string;
    slug?: string;
    logo?: string | null;
    series_count?: number;
    models_count?: number;
    created_at?: string;
    updated_at?: string;
  };
  // ✅ دقیقاً همان چیزی که ProductResource::seller واقعاً برمی‌گرداند —
  // status/health_score/reviews_count/orders_count/created_at/updated_at
  // هیچ‌وقت در این پاسخ نبوده‌اند؛ avatar/is_verified/total_sales هم که
  // واقعاً ارسال می‌شوند قبلاً اینجا حتی تعریف نشده بودند.
  seller?: {
    id: number;
    shop_name?: string;
    slug?: string;
    avatar?: string | null;
    rating?: string | number;
    is_verified?: boolean;
    products_count?: number;
    total_sales?: string | number;
  };
  category?: {
    id: number;
    parent_id?: number | null;
    name: string;
    slug: string;
    icon?: string;
    is_active?: boolean;
    products_count?: number;
    created_at?: string;
    updated_at?: string;
  };
}

export function mapApiProductToProduct(apiProduct: ApiProductResponse): Product {
  const price = Number(apiProduct.price) || 0;
  
  const comparePrice = apiProduct.compare_price 
    ? Number(apiProduct.compare_price)
    : (apiProduct.discount_price ? Number(apiProduct.discount_price) : null);
  
  const discountPercentage = apiProduct.discount_percentage 
    ? Number(apiProduct.discount_percentage)
    : ((comparePrice && price > 0 && comparePrice < price)
      ? Math.round(((price - comparePrice) / price) * 100)
      : 0);

  const mainImage = apiProduct.main_image || apiProduct.images?.[0] || '/images/placeholder.svg';

  // ✅ ProductResource.php::compatible_models (بک‌اند) فقط
  // { id, name, slug, brand: { id, name } | null } برمی‌گرداند —
  // series/release_year/image/specs/compatible_products_count هیچ‌وقت
  // در این پاسخ نبوده‌اند (بر خلاف چیزی که این تابع قبلاً فرض می‌کرد).
  // چون این فیلدها هیچ‌وقت واقعاً وجود نداشتند، همیشه مقدار پیش‌فرض
  // می‌گرفتند — یعنی تغییری در رفتار مشاهده‌شده ایجاد نمی‌شود، فقط نوع‌ها
  // با واقعیت API هماهنگ می‌شوند. DeviceCompatibility.tsx (تنها مصرف‌کننده‌ی
  // واقعی این آرایه) هم فقط id/name/brand.name را می‌خواند.
  const compatibleModels: PhoneModel[] = (apiProduct.compatible_models || []).map((m) => ({
    id: m.id,
    series_id: 0,
    brand_id: m.brand?.id || 0,
    name: m.name,
    slug: m.slug || '',
    image: null,
    release_year: null,
    is_active: true,
    compatible_products_count: 0,
    brand: m.brand ? {
      id: m.brand.id,
      name: m.brand.name,
      slug: m.brand.name.toLowerCase(),
      logo: null,
      is_active: true,
      series_count: 0,
      models_count: 0,
      created_at: '',
      updated_at: '',
    } : undefined,
    series: undefined,
    specs: {},
    created_at: '',
    updated_at: '',
  }));

  const brand: Brand | undefined = apiProduct.brand ? {
    id: apiProduct.brand.id,
    name: apiProduct.brand.name,
    slug: apiProduct.brand.slug || apiProduct.brand.name.toLowerCase(),
    logo: apiProduct.brand.logo || null,
    is_active: true,
    series_count: apiProduct.brand.series_count || 0,
    models_count: apiProduct.brand.models_count || 0,
    created_at: apiProduct.brand.created_at || '',
    updated_at: apiProduct.brand.updated_at || '',
  } : undefined;

  const seller: Seller | undefined = apiProduct.seller ? {
    id: apiProduct.seller.id,
    user_id: apiProduct.seller.id,
    shop_name: apiProduct.seller.shop_name || 'فروشگاه',
    slug: apiProduct.seller.slug || 'shop',
    // ⚠️ status/health_score هیچ‌وقت از این endpoint نمی‌آیند (تایید شد
    // با ProductResource::seller) — این دو، مقدار پیش‌فرض معقول‌اند، نه
    // داده‌ی واقعی. اگر جایی از کد به این دو برای منطق واقعی (نه فقط
    // نمایش) تکیه کند، باید seller را جدا از /sellers/{slug} گرفت.
    status: 'active',
    health_score: 90,
    rating: Number(apiProduct.seller.rating || 0),
    products_count: apiProduct.seller.products_count || 0,
    // ✅ قبلاً این سه که واقعاً در پاسخ هستند اصلاً خوانده نمی‌شدند —
    // یعنی آواتار فروشنده و نشان «تایید‌شده» روی لیست محصولات همیشه خالی
    // بود، حتی وقتی بک‌اند مقدار واقعی می‌فرستاد.
    avatar: apiProduct.seller.avatar ?? null,
    is_verified: apiProduct.seller.is_verified ?? false,
    total_sales: Number(apiProduct.seller.total_sales || 0),
    // این دو هم مثل status/health_score از این endpoint نمی‌آیند.
    created_at: '',
    updated_at: '',
  } : undefined;

  return {
    id: apiProduct.id,
    seller_id: apiProduct.seller_id || apiProduct.seller?.id || 1,
    category_id: apiProduct.category?.id || apiProduct.category_id || 0,
    // ✅ Product در types/models.ts فیلد brand_id مستقل ندارد (فقط
    // brand?: Brand تو در تو) — این خط قبلاً یک excess property بود که
    // TS به‌خاطر خطاهای دیگر همین object literal گزارش نمی‌داد؛ چون
    // هیچ مصرف‌کننده‌ای product.brand_id را نمی‌خواند (تایید شد)، حذف شد.
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description || '',
    short_description: apiProduct.short_description || '',
    price: price,
    compare_price: comparePrice && comparePrice > price ? comparePrice : undefined,
    stock: apiProduct.stock || 0,
    sku: apiProduct.sku || '',
    status: apiProduct.is_active ? 'active' : 'inactive',
    images: apiProduct.images?.length ? apiProduct.images : [mainImage],
    main_image: mainImage,
    specifications: apiProduct.specifications || {},
    rating: Number(apiProduct.rating) || 0,
    reviews_count: apiProduct.reviews_count || 0,
    discount_percentage: discountPercentage,
    views_count: apiProduct.views_count || 0,
    sales_count: apiProduct.sales_count || 0,
    compatible_models: compatibleModels,
    brand: brand,
    seller: seller,
    category: apiProduct.category ? {
      id: apiProduct.category.id,
      parent_id: apiProduct.category.parent_id ?? null,
      name: apiProduct.category.name,
      slug: apiProduct.category.slug,
      icon: apiProduct.category.icon || '📦',
      type: 'mobile_accessory',
      is_active: apiProduct.category.is_active ?? true,
      products_count: apiProduct.category.products_count || 0,
      created_at: apiProduct.category.created_at || '',
      updated_at: apiProduct.category.updated_at || '',
    } : undefined,
    created_at: apiProduct.created_at || '',
    updated_at: apiProduct.updated_at || '',
  };
}

// ✅ حذف any از توابع دیگر
interface ApiCategoryResponse {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  icon?: string;
  is_active?: boolean;
  products_count?: number;
  children?: ApiCategoryResponse[];
  created_at?: string;
  updated_at?: string;
}

const iconMap: Record<string, string> = {
  'shield': '🛡️', 'screen': '🔲', 'charger': '🔌', 'headphones': '🎧',
  'battery': '🔋', 'watch': '⌚', 'holder': '📱', 'tools': '🔧',
  'phone': '📱', 'laptop': '💻', 'tablet': '📟', 'console': '🎮',
};

export function mapApiCategoryToCategory(apiCategory: ApiCategoryResponse): Category {
  return {
    id: apiCategory.id,
    parent_id: apiCategory.parent_id ?? null,
    name: apiCategory.name,
    slug: apiCategory.slug,
    // ✅ icon اختیاری است؛ قبلاً iconMap[apiCategory.icon] با icon=undefined
    // صدا زده می‌شد — در JS همیشه بی‌صدا به fallback می‌رسید (کلید
    // "undefined" هیچ‌وقت match نمی‌شود)، ولی از نظر تایپ نامعتبر بود.
    icon: apiCategory.icon
      ? (apiCategory.icon.length <= 2 ? apiCategory.icon : (iconMap[apiCategory.icon] || '📦'))
      : '📦',
    type: 'mobile_accessory',
    is_active: apiCategory.is_active ?? true,
    products_count: apiCategory.products_count || 0,
    children: apiCategory.children?.map(mapApiCategoryToCategory),
    created_at: apiCategory.created_at || '',
    updated_at: apiCategory.updated_at || '',
  };
}

interface ApiBrandResponse {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  is_active?: boolean;
  series_count?: number;
  models_count?: number;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export function mapApiBrandToBrand(apiBrand: ApiBrandResponse): Brand {
  return {
    id: apiBrand.id,
    name: apiBrand.name,
    slug: apiBrand.slug,
    logo: apiBrand.logo || '',
    is_active: apiBrand.is_active ?? true,
    series_count: apiBrand.series_count || 0,
    models_count: apiBrand.models_count || apiBrand.products_count || 0,
    created_at: apiBrand.created_at || '',
    updated_at: apiBrand.updated_at || '',
  };
}

export function mapApiProducts(products: ApiProductResponse[]): Product[] {
  return products.map(mapApiProductToProduct);
}

export function mapApiCategories(categories: ApiCategoryResponse[]): Category[] {
  return categories.map(mapApiCategoryToCategory);
}

export function mapApiBrands(brands: ApiBrandResponse[]): Brand[] {
  return brands.map(mapApiBrandToBrand);
}