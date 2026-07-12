import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/api/product.service';
import { mapApiProducts } from '@/utils/apiAdapter';
import type { Product } from '@/types/models';
import type { FilterMode } from '../types';
import { PRODUCTS_PER_PAGE } from '../constants';

interface UseProductsOptions {
  filterMode: FilterMode;
  selectedModelId?: number;
  selectedDeviceIds: number[];
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * هوک دریافت محصولات با پشتیبانی از فیلترهای مختلف
 * - all: همه محصولات
 * - header-device: محصولات سازگار با دستگاه انتخابی در هدر
 * - my-devices: محصولات سازگار با چندین دستگاه کاربر
 */
export function useProducts({
  filterMode,
  selectedModelId,
  selectedDeviceIds,
}: UseProductsOptions): UseProductsResult {
  const queryKey = ['products', filterMode, selectedModelId, selectedDeviceIds];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let response;

      if (filterMode === 'header-device' && selectedModelId) {
        response = await productService.getCompatibleProducts(selectedModelId);
      } else if (filterMode === 'my-devices' && selectedDeviceIds.length > 0) {
        response = await productService.getCompatibleProductsMulti(selectedDeviceIds);
      } else {
        response = await productService.getProducts({ per_page: PRODUCTS_PER_PAGE });
      }

      if (response.success) {
        const apiData = response.data?.data || response.data || [];
        return mapApiProducts(apiData);
      }

      throw new Error('API returned unsuccessful');
    },
    enabled: filterMode !== 'my-devices' || selectedDeviceIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });

  return {
    products: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}