import { useState, useEffect, useRef } from 'react';
import { productService } from '@/services/api/product.service';
import { categoryService } from '@/services/api/category.service';
import { brandService } from '@/services/api/brand.service';
import type { Product, Category, Brand } from '@/types/models';
import { logger } from '@/utils/logger';

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
        logger.debug('useHomeData: قبلاً fetch شده، استفاده از state');
        setData(cachedData);
        return;
      }

      // اگر در حال fetch است، صبر کن
      if (isFetching && fetchPromise) {
        logger.debug('useHomeData: در حال fetch، صبر کنید...');
        try {
          const result = await fetchPromise;
          if (isMounted.current) {
            setData(result);
          }
        } catch (error) {
          logger.error('Error waiting for fetch:', error as Error);
        }
        return;
      }

      // شروع fetch جدید
      isFetching = true;
      fetchPromise = (async () => {
        try {
          logger.info('useHomeData: شروع fetch داده‌ها...');

          const [productsRes, categoriesRes, brandsRes, featuredRes, specialOffersRes] = await Promise.allSettled([
            productService.getProducts({ per_page: 50 }),
            categoryService.getCategories(),
            brandService.getBrands(),
            productService.getFeatured(),
            productService.getSpecialOffers(),
          ]);

          // ✅ استخراج صحیح داده‌ها با بررسی ساختار
          let products: Product[] = [];
          let categories: Category[] = [];
          let brands: Brand[] = [];

          if (productsRes.status === 'fulfilled') {
            // ✅ این بلوک عمداً چند شکل احتمالی پاسخ را (پشت Array.isArray،
            // یعنی بدون ریسک واقعی runtime) چک می‌کند؛ تایپ سرویس فقط یکی
            // از این شکل‌ها را می‌شناسد، برای همین response اینجا any است
            // تا این بررسی دفاعی رفتارش عوض نشود.
            const response = productsRes.value as any;
            // بررسی ساختارهای مختلف
            if (Array.isArray(response.data)) {
              products = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              products = response.data.data;
            } else if (response.data && Array.isArray(response.data.products)) {
              products = response.data.products;
            }
            logger.debug(`Products: ${products.length} items`);
          }

          if (categoriesRes.status === 'fulfilled') {
            const response = categoriesRes.value as any;
            if (Array.isArray(response.data)) {
              categories = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              categories = response.data.data;
            } else if (response.data && Array.isArray(response.data.categories)) {
              categories = response.data.categories;
            }
            logger.debug(`Categories: ${categories.length} items`);
          }

          if (brandsRes.status === 'fulfilled') {
            const response = brandsRes.value as any;
            if (Array.isArray(response.data)) {
              brands = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              brands = response.data.data;
            } else if (response.data && Array.isArray(response.data.brands)) {
              brands = response.data.brands;
            }
            logger.debug(`Brands: ${brands.length} items`);
          }

          // ✅ قبلاً featured/specialOffers با فیلتر سمت کلاینت روی همان ۵۰
          // محصولِ per_page به دست می‌آمدند — یعنی اگر محصولات ویژه/تخفیف‌دار
          // واقعی در بین آن ۵۰ محصول (بر اساس created_at جدیدترین) نبودند،
          // این بخش‌ها کمتر از واقعیت یا خالی نشان داده می‌شدند. endpointهای
          // اختصاصی /products/featured و /products/special-offers از قبل
          // در بک‌اند درست فیلتر و کش می‌شوند (ProductService::getFeaturedProducts
          // با Cache::remember یک‌ساعته) — فقط تا الان فرانت‌اند صداشان
          // نمی‌زد.
          let featuredProducts: Product[] = [];
          if (featuredRes.status === 'fulfilled') {
            const response = featuredRes.value as any;
            featuredProducts = Array.isArray(response.data) ? response.data : [];
          }

          let specialOffers: Product[] = [];
          if (specialOffersRes.status === 'fulfilled') {
            const response = specialOffersRes.value as any;
            specialOffers = Array.isArray(response.data) ? response.data : [];
          }

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

          logger.info('useHomeData: داده‌ها با موفقیت لود شدند');
          return result;

        } catch (error) {
          logger.error('خطا در لود داده‌ها:', error as Error);
          
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