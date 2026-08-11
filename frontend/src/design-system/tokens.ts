/**
 * AZKALA DESIGN SYSTEM - Design Tokens
 *
 * این فایل قلب Design System ازکالا است.
 * همه کامپوننت‌ها باید از این tokens استفاده کنند، نه مقادیر hardcode.
 *
 * ساختار:
 *   Brand Colors → Semantic Tokens → Components → Pages
 *
 * اگر رنگ برند ازکالا تغییر کند، کل سیستم یکجا تغییر می‌کند.
 */

// ==================== Brand Colors ====================
// رنگ اصلی ازکالا (Teal)
export const BRAND_COLORS = {
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488', // Brand Color اصلی
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
} as const;

// ==================== Semantic Colors ====================
// این tokens باید در کامپوننت‌ها استفاده شوند، نه BRAND_COLORS مستقیم
export const SEMANTIC_COLORS = {
  // رنگ‌های اصلی
  primary: 'var(--color-primary-600)',
  'primary-hover': 'var(--color-primary-700)',
  'primary-light': 'var(--color-primary-50)',

  // موفقیت، هشدار، خطا
  success: '#10b981',
  'success-light': '#d1fae5',
  warning: '#f59e0b',
  'warning-light': '#fef3c7',
  error: '#ef4444',
  'error-light': '#fee2e2',
  info: '#3b82f6',
  'info-light': '#dbeafe',

  // خنثی
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  muted: 'var(--color-muted)',
  border: 'var(--color-border)',
} as const;

// ==================== Typography ====================
// بر اساس Vazirmatn
export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'Vazirmatn, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' },       // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },  // 14px
    base: { size: '1rem', lineHeight: '1.5rem' },     // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },  // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },   // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },    // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
} as const;

// ==================== Spacing ====================
// سیستم 4px base
export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// ==================== Border Radius ====================
export const RADIUS = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',
} as const;

/**
 * Radius اختصاصی برای کامپوننت‌های مختلف
 */
export const COMPONENT_RADIUS = {
  button: RADIUS.md,     // 8px
  input: RADIUS.md,      // 8px
  card: RADIUS.lg,       // 12px
  productCard: RADIUS.lg, // 12px
  modal: RADIUS.xl,      // 16px
  avatar: RADIUS.full,
  badge: RADIUS.md,      // 8px
} as const;

// ==================== Shadows ====================
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ==================== Breakpoints ====================
// Mobile-first
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ==================== Animation ====================
export const TRANSITIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ==================== Product-Specific Tokens ====================
export const PRODUCT = {
  // نسبت ابعاد تصویر محصول
  aspectRatio: '4/3',

  // ارتفاع‌های استاندارد
  imageHeight: {
    sm: '160px',
    md: '200px',
    lg: '240px',
  },

  // Badge ها
  badges: {
    discount: {
      bg: 'bg-error-500',
      text: 'text-white',
      icon: 'Flame',
    },
    bestseller: {
      bg: 'bg-warning-500',
      text: 'text-white',
      icon: 'Crown',
    },
    new: {
      bg: 'bg-success-500',
      text: 'text-white',
      icon: 'Sparkles',
    },
    compatible: {
      bg: 'bg-success-50 dark:bg-success-900/30',
      text: 'text-success-700 dark:text-success-300',
      icon: 'CheckCircle',
    },
    incompatible: {
      bg: 'bg-error-50 dark:bg-error-900/30',
      text: 'text-error-700 dark:text-error-300',
      icon: 'XCircle',
    },
  },
} as const;

// ==================== Device-Specific Tokens ====================
export const DEVICE = {
  icons: {
    mobile: 'Smartphone',
    tablet: 'Tablet',
    laptop: 'Laptop',
    watch: 'Watch',
    headphones: 'Headphones',
    default: 'Smartphone',
  },
  // رنگ‌های برند دستگاه
  brandColors: {
    apple: '#000000',
    samsung: '#1428a0',
    xiaomi: '#ff6900',
    huawei: '#cf0a2c',
    default: '#6b7280',
  },
} as const;

// ==================== Helper Functions ====================

/**
 * تبدیل قیمت به فرمت فارسی
 */
export const formatPriceFa = (price: number): string => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

/**
 * محاسبه درصد تخفیف
 */
export const calculateDiscountPercent = (price: number, comparePrice?: number): number => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};

/**
 * تولید متن وضعیت موجودی
 */
export const getStockStatus = (stock: number): {
  label: string;
  color: 'success' | 'warning' | 'error';
  isAvailable: boolean;
} => {
  if (stock === 0) {
    return { label: 'ناموجود', color: 'error', isAvailable: false };
  }
  if (stock < 5) {
    return { label: `فقط ${stock} عدد`, color: 'warning', isAvailable: true };
  }
  return { label: 'موجود', color: 'success', isAvailable: true };
};