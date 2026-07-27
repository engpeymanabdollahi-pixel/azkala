// src/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { categoryService, type Category } from '@/services/api/category.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryService.getCategories(true);
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // ۱۰ دقیقه کش (سرعت فوق‌العاده بالا)
    gcTime: 1000 * 60 * 30,    // ۳۰ دقیقه در حافظه
  });
}