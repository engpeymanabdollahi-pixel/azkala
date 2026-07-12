import { useState, useEffect, useRef, useCallback } from 'react';
import type { Product } from '@/types/models';
import { 
  RECENTLY_VIEWED_STORAGE_KEY, 
  RECENTLY_VIEWED_MAX_ITEMS, 
  RECENTLY_VIEWED_DISPLAY_ITEMS 
} from '../constants';

/**
 * هوک مدیریت محصولات اخیراً مشاهده شده
 * با ذخیره در localStorage
 */
export function useRecentlyViewed(allProducts: Product[]) {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const isInitialized = useRef(false);

  // بارگذاری اولیه از localStorage
  useEffect(() => {
    if (!isInitialized.current && allProducts.length > 0) {
      isInitialized.current = true;
      try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
        if (stored) {
          const parsed: number[] = JSON.parse(stored);
          const products = allProducts.filter(p => parsed.includes(p.id));
          setRecentlyViewed(products.slice(0, RECENTLY_VIEWED_DISPLAY_ITEMS));
        }
      } catch (e) {
        console.error('Error parsing recently viewed:', e);
        localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
      }
    }
  }, [allProducts.length]);

  /**
   * افزودن محصول به لیست اخیراً مشاهده شده
   */
  const addToRecentlyViewed = useCallback((productId: number) => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      let viewed: number[] = stored ? JSON.parse(stored) : [];
      
      // حذف تکراری و افزودن به ابتدا
      viewed = viewed.filter(id => id !== productId);
      viewed.unshift(productId);
      viewed = viewed.slice(0, RECENTLY_VIEWED_MAX_ITEMS);
      
      localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(viewed));
      
      // به‌روزرسانی state
      const products = allProducts.filter(p => viewed.includes(p.id));
      setRecentlyViewed(products.slice(0, RECENTLY_VIEWED_DISPLAY_ITEMS));
    } catch (e) {
      console.error('Error saving recently viewed:', e);
    }
  }, [allProducts]);

  return { recentlyViewed, addToRecentlyViewed };
}