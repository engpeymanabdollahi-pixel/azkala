import { useState, useEffect, useRef } from 'react';
import { productService } from '@/services/api/product.service';
import { categoryService } from '@/services/api/category.service';
import { brandService } from '@/services/api/brand.service';
import type { Product, Category, Brand } from '@/types/models';

interface HomeData {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  featuredProducts: Product[];
  specialOffers: Product[];
  isLoading: boolean;
  error: string | null;
  isUsingMock: boolean;
}

// Cache برای جلوگیری از درخواست‌های تکراری
let cachedData: HomeData | null = null;
let isFetching = false;
let fetchPromise: Promise<HomeData> | null = null;

export function useHomeData(): HomeData {
  const [data, setData] = useState<HomeData>({
    products: [],
    categories: [],
    brands: [],
    featuredProducts: [],
    specialOffers: [],
    isLoading: true,
    error: null,
    isUsingMock: false,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      // اگر قبلاً fetch شده و داده داریم، استفاده از cache
      if (cachedData && !isFetching) {
        setData(cachedData);
        return;
      }

      // اگر در حال fetch است، صبر کن
      if (isFetching && fetchPromise) {
        try {
          const result = await fetchPromise;
          if (isMounted.current) {
            setData(result);
          }
        } catch (error) {
          console.error('Error waiting for fetch:', error);
        }
        return;
      }

      // شروع fetch جدید
      isFetching = true;
      fetchPromise = (async () => {
        try {
          const [productsRes, categoriesRes, brandsRes] = await Promise.allSettled([
            productService.getProducts({ per_page: 50 }),
            categoryService.getCategories(),
            brandService.getBrands(),
          ]);

          // ✅ استخراج صحیح داده‌ها با بررسی ساختار
          let products: Product[] = [];
          let categories: Category[] = [];
          let brands: Brand[] = [];

          if (productsRes.status === 'fulfilled') {
            const response = productsRes.value;
            // بررسی ساختارهای مختلف
            if (Array.isArray(response.data)) {
              products = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              products = response.data.data;
            } else if (response.data && Array.isArray(response.data.products)) {
              products = response.data.products;
            }
          }

          if (categoriesRes.status === 'fulfilled') {
            const response = categoriesRes.value;
            if (Array.isArray(response.data)) {
              categories = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              categories = response.data.data;
            } else if (response.data && Array.isArray(response.data.categories)) {
              categories = response.data.categories;
            }
          }

          if (brandsRes.status === 'fulfilled') {
            const response = brandsRes.value;
            if (Array.isArray(response.data)) {
              brands = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              brands = response.data.data;
            } else if (response.data && Array.isArray(response.data.brands)) {
              brands = response.data.brands;
            }
          }

          const featuredProducts = products.filter(p => p.is_featured).slice(0, 12);
          const specialOffers = products.filter(p => p.discount_percentage && p.discount_percentage > 0).slice(0, 8);

          const result: HomeData = {
            products,
            categories,
            brands,
            featuredProducts,
            specialOffers,
            isLoading: false,
            error: null,
            isUsingMock: false,
          };

          // ذخیره در cache
          cachedData = result;

          if (isMounted.current) {
            setData(result);
          }

          return result;

        } catch (error) {
          console.error('❌ useHomeData: خطا در لود داده‌ها:', error);
          
          const fallbackData: HomeData = {
            products: [],
            categories: [],
            brands: [],
            featuredProducts: [],
            specialOffers: [],
            isLoading: false,
            error: 'خطا در لود داده‌ها',
            isUsingMock: true,
          };

          if (isMounted.current) {
            setData(fallbackData);
          }

          return fallbackData;
        } finally {
          isFetching = false;
          fetchPromise = null;
        }
      })();

      await fetchPromise;
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  return data;
}