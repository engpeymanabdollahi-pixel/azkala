import type { Product, Category, Brand, PhoneModel, Seller } from '@/types/models';

/**
 * تبدیل ساختار API به ساختار mockData
 */
export function mapApiProductToProduct(apiProduct: any): Product {
  const price = parseFloat(apiProduct.price) || 0;
  
  // ✅ محاسبه compare_price: اول discount_price، بعد compare_price
  const comparePrice = apiProduct.compare_price 
    ? parseFloat(apiProduct.compare_price)
    : (apiProduct.discount_price ? parseFloat(apiProduct.discount_price) : null);
  
  // محاسبه درصد تخفیف
  const discountPercentage = apiProduct.discount_percentage 
    ? parseInt(apiProduct.discount_percentage)
    : ((comparePrice && price > 0 && comparePrice < price)
      ? Math.round(((price - comparePrice) / price) * 100)
      : 0);

  // تصویر اصلی
  const mainImage = apiProduct.main_image || apiProduct.images?.[0] || '/images/placeholder.svg';

  // ✅ نگاشت compatible_models
  const compatibleModels: PhoneModel[] = (apiProduct.compatible_models || []).map((m: any) => ({
    id: m.id,
    series_id: m.series_id || 0,
    brand_id: m.brand_id || m.brand?.id || 0,
    name: m.name,
    slug: m.slug || '',
    image: m.image || null,
    release_year: m.release_year || null,
    is_active: true,
    compatible_products_count: m.compatible_products_count || 0,
    brand: m.brand ? {
      id: m.brand.id,
      name: m.brand.name,
      slug: m.brand.slug || m.brand.name.toLowerCase(),
      logo: m.brand.logo || null,
      is_active: true,
      series_count: 0,
      models_count: 0,
      created_at: '',
      updated_at: '',
    } : undefined,
    series: m.series ? {
      id: m.series.id,
      brand_id: m.series.brand_id || 0,
      name: m.series.name,
      slug: m.series.slug || '',
      image: m.series.image || null,
      models_count: m.series.models_count || 0,
      created_at: '',
      updated_at: '',
    } : undefined,
    specs: m.specs || {},
    created_at: m.created_at || '',
    updated_at: m.updated_at || '',
  }));

  // ✅ نگاشت brand
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

  // ✅ نگاشت seller
  const seller: Seller | undefined = apiProduct.seller ? {
    id: apiProduct.seller.id,
    user_id: apiProduct.seller.id,
    shop_name: apiProduct.seller.shop_name || apiProduct.seller.name || 'فروشگاه',
    slug: apiProduct.seller.slug || 'shop',
    status: apiProduct.seller.status || 'active',
    health_score: apiProduct.seller.health_score || 90,
    rating: parseFloat(apiProduct.seller.rating || 0),
    reviews_count: apiProduct.seller.reviews_count || 0,
    products_count: apiProduct.seller.products_count || 0,
    orders_count: apiProduct.seller.orders_count || 0,
    created_at: apiProduct.seller.created_at || '',
    updated_at: apiProduct.seller.updated_at || '',
  } : undefined;

  return {
    id: apiProduct.id,
    seller_id: apiProduct.seller_id || apiProduct.seller?.id || 1,
    category_id: apiProduct.category?.id || apiProduct.category_id || 0,
    brand_id: apiProduct.brand_id || apiProduct.brand?.id || 0,
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
    rating: parseFloat(apiProduct.rating) || 0,
    reviews_count: apiProduct.reviews_count || 0,
    discount_percentage: discountPercentage,
    views_count: apiProduct.views_count || 0,
    sales_count: apiProduct.sales_count || 0,
    
    // ✅ فیلدهای جدید
    compatible_models: compatibleModels,
    brand: brand,
    seller: seller,
    
    category: apiProduct.category ? {
      id: apiProduct.category.id,
      parent_id: apiProduct.category.parent_id,
      name: apiProduct.category.name,
      slug: apiProduct.category.slug,
      icon: apiProduct.category.icon || '📦',
      type: 'mobile_accessory',
      is_active: apiProduct.category.is_active,
      products_count: apiProduct.category.products_count || 0,
      created_at: apiProduct.category.created_at,
      updated_at: apiProduct.category.updated_at,
    } : undefined,
    created_at: apiProduct.created_at,
    updated_at: apiProduct.updated_at,
  };
}

/**
 * نگاشت آیکون‌های string به emoji
 */
const iconMap: Record<string, string> = {
  'shield': '🛡️',
  'screen': '🔲',
  'charger': '🔌',
  'headphones': '🎧',
  'battery': '🔋',
  'watch': '⌚',
  'holder': '📱',
  'tools': '🔧',
  'phone': '📱',
  'laptop': '💻',
  'tablet': '📟',
  'console': '🎮',
};

export function mapApiCategoryToCategory(apiCategory: any): Category {
  return {
    id: apiCategory.id,
    parent_id: apiCategory.parent_id,
    name: apiCategory.name,
    slug: apiCategory.slug,
    icon: apiCategory.icon && apiCategory.icon.length <= 2 
      ? apiCategory.icon 
      : (iconMap[apiCategory.icon] || '📦'),
    type: 'mobile_accessory',
    is_active: apiCategory.is_active,
    products_count: apiCategory.products_count,
    children: apiCategory.children?.map(mapApiCategoryToCategory),
    created_at: apiCategory.created_at,
    updated_at: apiCategory.updated_at,
  };
}

export function mapApiBrandToBrand(apiBrand: any): Brand {
  return {
    id: apiBrand.id,
    name: apiBrand.name,
    slug: apiBrand.slug,
    logo: apiBrand.logo || '',
    is_active: apiBrand.is_active,
    series_count: apiBrand.series_count || 0,
    models_count: apiBrand.models_count || apiBrand.products_count || 0,
    created_at: apiBrand.created_at,
    updated_at: apiBrand.updated_at,
  };
}

/**
 * تبدیل آرایه API به آرایه mockData
 */
export function mapApiProducts(products: any[]): Product[] {
  return products.map(mapApiProductToProduct);
}

export function mapApiCategories(categories: any[]): Category[] {
  return categories.map(mapApiCategoryToCategory);
}

export function mapApiBrands(brands: any[]): Brand[] {
  return brands.map(mapApiBrandToBrand);
}