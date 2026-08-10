/**
 * Schema.org JSON-LD Generators برای ازکالا
 *
 * این فایل توابع تولید structured data برای Google را در خود جای داده است.
 * هر تابع یک Schema Type مشخص را تولید می‌کند و از طریق Seo component
 * به <head> اضافه می‌شود.
 *
 * مستندات: https://schema.org
 * تست: https://search.google.com/test/rich-results
 */

import { SITE_CONFIG, getFullUrl } from './seo-config';
import type { Product } from '@/types/models';
import type { MagazineArticle } from '@/types/magazine.types';

// ==================== Types ====================

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// ==================== Product Schema ====================

/**
 * Schema برای صفحه جزئیات محصول
 *
 * این Schema باعث می‌شود Google محصول را به‌صورت rich snippet نمایش دهد:
 * - قیمت
 * - موجودی
 * - ستاره‌ها و تعداد نظر
 * - برند
 */
export function generateProductSchema(product: Product): Record<string, any> {
  // تولید آرایه تصاویر (همیشه array از string)
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => (img.startsWith('http') ? img : getFullUrl(img)))
    : product.main_image
      ? [product.main_image.startsWith('http') ? product.main_image : getFullUrl(product.main_image)]
      : [getFullUrl('/images/placeholder.png')];

  // وضعیت موجودی
  let availability: string;
  if (product.stock > 10) {
    availability = 'https://schema.org/InStock';
  } else if (product.stock > 0) {
    availability = 'https://schema.org/LimitedAvailability';
  } else {
    availability = 'https://schema.org/OutOfStock';
  }

  // ساخت offers
  const offers: Record<string, any> = {
    '@type': 'Offer',
    url: getFullUrl(`/products/${product.slug}`),
    priceCurrency: 'IRR',
    price: String(product.price),
    availability,
    itemCondition: 'https://schema.org/NewCondition',
  };

  // اگر قیمت مقایسه‌ای (قبلی) دارد، نشان دهیم تخفیف خورده
  if (product.compare_price && product.compare_price > product.price) {
    offers.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: String(product.price),
      priceCurrency: 'IRR',
    };
  }

  // اضافه کردن seller (Seller interface ازکالا فیلد shop_name دارد، نه name)
  const sellerName = (product.seller as any)?.shop_name || (product.seller as any)?.name;
  if (sellerName) {
    offers.seller = {
      '@type': 'Organization',
      name: sellerName,
    };
  }

  // Schema اصلی
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || product.description,
    image: images,
    sku: product.sku || String(product.id),
    url: getFullUrl(`/products/${product.slug}`),
    offers,
  };

  // برند
  if (product.brand?.name) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand.name,
    };
  }

  // دسته‌بندی
  if (product.category?.name) {
    schema.category = product.category.name;
  }

  // Aggregate Rating (اگر rating و reviews_count داریم)
  if (product.rating && product.rating > 0 && product.reviews_count && product.reviews_count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(product.rating.toFixed(1)),
      reviewCount: String(product.reviews_count),
      bestRating: '5',
      worstRating: '1',
    };
  }

  // وزن (اگر داریم - convert از gram به kg)
  if (product.weight_gram && product.weight_gram > 0) {
    schema.weight = {
      '@type': 'QuantitativeValue',
      value: (product.weight_gram / 1000).toFixed(3),
      unitCode: 'KGM', // kilograms
    };
  }

  // ابعاد
  if (product.dimensions_cm) {
    const { w, h, l } = product.dimensions_cm;
    if (w && h && l) {
      schema.depth = { '@type': 'QuantitativeValue', value: String(l), unitCode: 'CMT' };
      schema.width = { '@type': 'QuantitativeValue', value: String(w), unitCode: 'CMT' };
      schema.height = { '@type': 'QuantitativeValue', value: String(h), unitCode: 'CMT' };
    }
  }

  return schema;
}

// ==================== BreadcrumbList Schema ====================

/**
 * Schema برای breadcrumbs
 *
 * باعث می‌شود Google در نتایج جستجو، مسیر ناوبری را نمایش دهد:
 * ازکالا > موبایل > قاب > قاب آیفون ۱۵
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : getFullUrl(item.url),
    })),
  };
}

// ==================== Article Schema ====================

/**
 * Schema برای مقاله مجله
 *
 * Google مقالات را با تاریخ، نویسنده و تصویر نمایش می‌دهد.
 * مناسب برای Top Stories و News carousels.
 */
export function generateArticleSchema(article: MagazineArticle): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || '',
    url: getFullUrl(`/magazine/${article.slug}`),
    datePublished: article.published_at,
    dateModified: article.published_at, // اگر updated_at دارید، از آن استفاده کنید
    inLanguage: 'fa-IR',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getFullUrl(`/magazine/${article.slug}`),
    },
  };

  // تصویر شاخص
  if (article.featured_image) {
    schema.image = {
      '@type': 'ImageObject',
      url: article.featured_image.startsWith('http')
        ? article.featured_image
        : getFullUrl(article.featured_image),
    };
  }

  // نویسنده
  if (article.author?.name) {
    schema.author = {
      '@type': 'Person',
      name: article.author.name,
    };
  } else {
    // اگر نویسنده نداریم، ازکالا به‌عنوان نویسنده
    schema.author = {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
    };
  }

  // ناشر (همیشه ازکالا)
  schema.publisher = {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    logo: {
      '@type': 'ImageObject',
      url: getFullUrl('/icons/icon-512.png'),
    },
  };

  // دسته‌بندی
  if (article.category?.label) {
    schema.articleSection = article.category.label;
  }

  // کلمات کلیدی از tags (اگر در آینده اضافه کردید)
  // schema.keywords = '...';

  return schema;
}

// ==================== CollectionPage Schema ====================

/**
 * Schema برای صفحه لیست مقالات (Magazine)
 *
 * به Google می‌گوید این صفحه مجموعه‌ای از مقالات است.
 */
export function generateCollectionPageSchema(
  title: string,
  description: string,
  url: string
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: url.startsWith('http') ? url : getFullUrl(url),
    inLanguage: 'fa-IR',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };
}

// ==================== WebSite Schema (برای HomePage) ====================

/**
 * Schema برای کل سایت
 *
 * این Schema باعث می‌شود Google sitelinks search box را برای ازکالا نمایش دهد.
 * وقتی کاربر سرچ کند "ازکالا"، Google یک باکس جستجوی مستقیم در نتایج نشان می‌دهد.
 */
export function generateWebSiteSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.nameEn,
    url: SITE_CONFIG.url,
    inLanguage: 'fa-IR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ==================== Organization Schema ====================

/**
 * Schema برای سازمان/کسب‌وکار ازکالا
 *
 * Google این اطلاعات را در Knowledge Panel نمایش می‌دهد.
 */
export function generateOrganizationSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.nameEn,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: getFullUrl('/icons/icon-512.png'),
    },
    description: SITE_CONFIG.description,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Persian', 'English'],
    },
    sameAs: [
      // وقتی لینک‌های شبکه‌های اجتماعی را اضافه کردید:
      // 'https://instagram.com/azkala',
      // 'https://twitter.com/azkala',
      // 'https://linkedin.com/company/azkala',
    ],
  };
}

// ==================== Store Schema (Marketplace) ====================

/**
 * Schema مخصوص فروشگاه/مارکت‌پلیس
 */
export function generateStoreSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    image: getFullUrl('/icons/icon-512.png'),
    description: SITE_CONFIG.description,
    priceRange: '$$',
    servesCuisine: '', // نه برای marketplace
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IR',
    },
  };
}