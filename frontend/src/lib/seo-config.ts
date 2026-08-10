/**
 * SEO Configuration برای ازکالا
 * 
 * تمام تنظیمات پایه SEO در یکجا
 */

export const SITE_CONFIG = {
  name: 'ازکالا',
  nameEn: 'Azkala',
  description: 'اولین موتور هوشمند کشف و خرید لوازم جانبی بر اساس مدل دستگاه',
  descriptionEn: 'Azkala - Smart marketplace for mobile accessories',
  url: import.meta.env.VITE_SITE_URL || 'https://azkala.com',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@azkala',
  locale: 'fa_IR',
  type: 'website',
};

export const SEO_DEFAULTS = {
  titleTemplate: '%s | ازکالا',
  defaultTitle: 'ازکالا | مارکت‌پلیس لوازم جانبی موبایل',
  defaultDescription: SITE_CONFIG.description,
};

/**
 * تولید URL کامل
 */
export const getFullUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
};

/**
 * Schema.org types
 */
export const SCHEMA_TYPES = {
  Organization: 'Organization',
  WebSite: 'WebSite',
  Product: 'Product',
  Article: 'Article',
  BreadcrumbList: 'BreadcrumbList',
  Store: 'Store',
} as const;