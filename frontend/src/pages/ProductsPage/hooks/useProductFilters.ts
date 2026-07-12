import { useState, useMemo, useCallback } from 'react';
import type { Product } from '@/types/models';
import type { FilterState, SortOption } from '../types';
import {
  DEFAULT_PRICE_RANGE,
  DEFAULT_MIN_RATING,
  DEFAULT_SORT_OPTION,
} from '../constants';

interface UseProductFiltersResult {
  filters: FilterState;
  filteredProducts: Product[];
  activeFiltersCount: number;
  // Setters
  setSelectedCategory: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setMinRating: (rating: number) => void;
  setOnlyDiscounted: (value: boolean) => void;
  setOnlyInStock: (value: boolean) => void;
  setSortBy: (sort: SortOption) => void;
  resetFilters: () => void;
}

/**
 * هوک مدیریت فیلترهای محصولات
 * شامل: دسته‌بندی، جستجو، قیمت، امتیاز، تخفیف، موجودی، مرتب‌سازی
 */
export function useProductFilters(allProducts: Product[]): UseProductFiltersResult {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>(DEFAULT_PRICE_RANGE);
  const [minRating, setMinRating] = useState(DEFAULT_MIN_RATING);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>(DEFAULT_SORT_OPTION);

  // محاسبه تعداد فیلترهای فعال
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== null) count++;
    if (priceRange[0] !== DEFAULT_PRICE_RANGE[0] || priceRange[1] !== DEFAULT_PRICE_RANGE[1]) count++;
    if (minRating > DEFAULT_MIN_RATING) count++;
    if (onlyDiscounted) count++;
    if (onlyInStock) count++;
    return count;
  }, [selectedCategory, priceRange, minRating, onlyDiscounted, onlyInStock]);

  // اعمال فیلترها و مرتب‌سازی
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // فیلتر دسته‌بندی
    if (selectedCategory !== null) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // فیلتر جستجو
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // فیلتر قیمت
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // فیلتر امتیاز
    if (minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= minRating);
    }

    // فیلتر تخفیف‌دار
    if (onlyDiscounted) {
      result = result.filter((p) => p.discount_percentage && p.discount_percentage > 0);
    }

    // فیلتر موجود
    if (onlyInStock) {
      result = result.filter((p) => p.stock > 0);
    }

    // مرتب‌سازی
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0));
        break;
    }

    return result;
  }, [allProducts, selectedCategory, searchQuery, priceRange, minRating, onlyDiscounted, onlyInStock, sortBy]);

  // ریست کردن همه فیلترها
  const resetFilters = useCallback(() => {
    setSelectedCategory(null);
    setPriceRange(DEFAULT_PRICE_RANGE);
    setMinRating(DEFAULT_MIN_RATING);
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setSearchQuery('');
  }, []);

  const filters: FilterState = {
    selectedCategory,
    searchQuery,
    priceRange,
    minRating,
    onlyDiscounted,
    onlyInStock,
    sortBy,
  };

  return {
    filters,
    filteredProducts,
    activeFiltersCount,
    setSelectedCategory,
    setSearchQuery,
    setPriceRange,
    setMinRating,
    setOnlyDiscounted,
    setOnlyInStock,
    setSortBy,
    resetFilters,
  };
}