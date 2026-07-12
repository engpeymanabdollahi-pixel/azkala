import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSellerProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  CreateProductData 
} from '@/services/sellerProduct.service';
import toast from 'react-hot-toast';

/**
 * هوک دریافت لیست محصولات فروشنده
 */
export const useSellerProducts = (page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ['seller-products', page, perPage],
    queryFn: () => getSellerProducts(page, perPage),
    staleTime: 1000 * 60, // 1 دقیقه
  });
};

/**
 * هوک ثبت محصول جدید
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => createProduct(data),
    onSuccess: () => {
      // invalidate کردن cache لیست محصولات
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('محصول با موفقیت ثبت شد!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در ثبت محصول';
      toast.error(message);
    },
  });
};

/**
 * هوک به‌روزرسانی محصول
 */
export const useUpdateProduct = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateProductData>) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('محصول به‌روزرسانی شد!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در به‌روزرسانی محصول';
      toast.error(message);
    },
  });
};

/**
 * هوک حذف محصول
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('محصول حذف شد!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در حذف محصول';
      toast.error(message);
    },
  });
};