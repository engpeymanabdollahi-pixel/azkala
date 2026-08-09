/**
 * TypeScript types برای مجله ازکالا
 * 
 * این types با MagazineResource و MagazineSummaryResource در backend هماهنگ هستند
 */

// ==================== Core Types ====================

export interface MagazineArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string; // فقط در show() برگردانده می‌شود
  featured_image: string | null;
  
  source: {
    name: string | null;
    url: string | null;
    is_external: boolean;
  };
  
  author?: {
    id: number;
    name: string;
    avatar: string | null;
  };
  
  category: {
    key: MagazineCategoryKey;
    label: string;
  };
  
  content_source: {
    key: 'admin' | 'rss' | 'ai_generated';
    label: string;
    is_ai_rewritten: boolean;
  };
  
  devices?: DeviceSummary[];
  
  stats: {
    view_count: number;
    devices_count?: number;
  };
  
  published_at: string;
  published_at_human: string;
  created_at: string;
  updated_at: string;
}

// ==================== Supporting Types ====================

export interface DeviceSummary {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  release_year: number | null;
  
  brand?: {
    id: number;
    name: string;
    slug: string;
  };
  
  series?: {
    id: number;
    name: string;
  };
  
  relevance_score?: number; // از pivot table
}

// ==================== API Response Types ====================

export interface MagazineListResponse {
  success: boolean;
  data: MagazineArticle[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
  };
}

export interface MagazineShowResponse {
  success: boolean;
  data: MagazineArticle;
  related: MagazineArticle[];
}

export interface MagazineDeviceNewsResponse {
  success: boolean;
  data: MagazineArticle[];
  count: number;
}

export interface MagazineFeaturedResponse {
  success: boolean;
  data: MagazineArticle[];
}

export interface MagazineStatsResponse {
  success: boolean;
  data: {
    total_articles: number;
    total_views: number;
    by_category: Record<MagazineCategoryKey, number>;
    latest_article: string | null;
  };
}

// ==================== Enum/Union Types ====================

export type MagazineCategoryKey = 'news' | 'review' | 'comparison' | 'guide' | 'rumor';

export type MagazineCategoryFilter = 'all' | MagazineCategoryKey;

// ==================== Component Props Types ====================

export interface ArticleCardProps {
  article: MagazineArticle;
  variant?: 'default' | 'compact' | 'featured';
  showImage?: boolean;
  showExcerpt?: boolean;
  showMeta?: boolean;
  className?: string;
}

export interface ArticleGridProps {
  articles: MagazineArticle[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export interface CategoryTabsProps {
  activeCategory: MagazineCategoryFilter;
  onCategoryChange: (category: MagazineCategoryFilter) => void;
  className?: string;
}

export interface DeviceNewsWidgetProps {
  modelId: number;
  modelName: string;
  limit?: number;
  className?: string;
}

export interface MagazinePageProps {
  // props اگر لازم شد
}

// ==================== Query Params Types ====================

export interface MagazineQueryParams {
  page?: number;
  per_page?: number;
  category?: MagazineCategoryFilter;
  search?: string;
}

export interface DeviceNewsQueryParams {
  modelId: number;
  limit?: number;
}

// ==================== Constants ====================

export const MAGAZINE_CATEGORIES: Record<MagazineCategoryKey, { key: MagazineCategoryKey; label: string; icon: string }> = {
  news: { key: 'news', label: 'اخبار', icon: '📰' },
  review: { key: 'review', label: 'بررسی', icon: '🔍' },
  comparison: { key: 'comparison', label: 'مقایسه', icon: '⚖️' },
  guide: { key: 'guide', label: 'راهنما', icon: '📚' },
  rumor: { key: 'rumor', label: 'شایعات', icon: '🔮' },
};

export const MAGAZINE_CATEGORY_COLORS: Record<MagazineCategoryKey, string> = {
  news: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  review: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  comparison: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  guide: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  rumor: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};