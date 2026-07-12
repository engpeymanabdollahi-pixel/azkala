import {
  TrendingUp, Package, ArrowUpDown, Star,
} from 'lucide-react';
import type { PriceRange, SortOptionConfig } from './types';

// ==================== Price Ranges ====================

export const PRICE_RANGES: PriceRange[] = [
  { label: 'همه قیمت‌ها', min: 0, max: 10000000 },
  { label: 'زیر ۱۰۰ هزار', min: 0, max: 100000 },
  { label: '۱۰۰ تا ۵۰۰ هزار', min: 100000, max: 500000 },
  { label: '۵۰۰ هزار تا ۱ میلیون', min: 500000, max: 1000000 },
  { label: '۱ تا ۲ میلیون', min: 1000000, max: 2000000 },
  { label: 'بالای ۲ میلیون', min: 2000000, max: 10000000 },
];

// ==================== Sort Options ====================

export const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'popular', label: 'محبوب‌ترین', icon: TrendingUp },
  { value: 'newest', label: 'جدیدترین', icon: Package },
  { value: 'price_asc', label: 'ارزان‌ترین', icon: ArrowUpDown },
  { value: 'price_desc', label: 'گران‌ترین', icon: ArrowUpDown },
  { value: 'rating', label: 'بیشترین امتیاز', icon: Star },
];

// ==================== Rating Options ====================

export const RATING_OPTIONS = [0, 4, 4.5] as const;

// ==================== Default Values ====================

export const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000000];
export const DEFAULT_MIN_RATING = 0;
export const DEFAULT_LAYOUT_MODE = 'grid' as const;
export const DEFAULT_SORT_OPTION = 'popular' as const;

// ==================== UI Constants ====================

export const PRODUCTS_PER_PAGE = 100;
export const SKELETON_COUNT = 10;
export const MOBILE_DRAWER_MAX_HEIGHT = '85vh';