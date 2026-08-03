import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function usePrefetch() {
  const queryClient = useQueryClient();

  // مثال: پیش‌واکشی داده‌های یک محصول
  const prefetchProduct = useCallback(
    (productId: string | number) => {
      queryClient.prefetchQuery({
        queryKey: ['product', productId],
        queryFn: () => {
          // جایگزین با سرویس واقعی خودتان
          return fetch(`/api/v1/products/${productId}`).then((res) => res.json());
        },
        staleTime: 1000 * 60 * 5, // ۵ دقیقه معتبر است
      });
    },
    [queryClient]
  );

  // مثال: پیش‌واکشی لیست محصولات یک دسته‌بندی
  const prefetchCategory = useCallback(
    (categoryId: string | number) => {
      queryClient.prefetchQuery({
        queryKey: ['products', 'category', categoryId],
        queryFn: () => {
          return fetch(`/api/v1/products?category_id=${categoryId}`).then((res) => res.json());
        },
        staleTime: 1000 * 60 * 5,
      });
    },
    [queryClient]
  );

  return { prefetchProduct, prefetchCategory };
}