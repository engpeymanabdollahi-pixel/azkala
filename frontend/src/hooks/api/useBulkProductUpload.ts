import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  downloadBulkTemplate,
  validateBulkFile,
  commitBulkProducts,
  BulkValidateResponse,
  BulkCommitResponse,
  BulkValidateRow,
} from '@/services/sellerBulkProduct.service';
import toast from 'react-hot-toast';

/**
 * Hook دانلود template
 */
export const useDownloadBulkTemplate = () => {
  return useMutation({
    mutationFn: () => downloadBulkTemplate(),
    onSuccess: (blob) => {
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `azkala-bulk-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template با موفقیت دانلود شد');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در دانلود template';
      toast.error(message);
    },
  });
};

/**
 * Hook validate فایل
 */
export const useValidateBulkFile = () => {
  return useMutation({
    mutationFn: (file: File) => validateBulkFile(file),
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در پردازش فایل';
      toast.error(message);
    },
  });
};

/**
 * Hook commit محصولات
 */
export const useCommitBulkProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (validRows: BulkValidateRow[]) => commitBulkProducts(validRows),
    onSuccess: (data: BulkCommitResponse) => {
      // invalidate لیست محصولات
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });

      const created = data.created?.length || 0;
      const failed = data.failed?.length || 0;

      if (failed > 0) {
        toast(`${created} محصول ایجاد شد، ${failed} مورد ناموفق بود`, {
          icon: '⚠️',
          duration: 5000,
        });
      } else {
        toast.success(`${created} محصول با موفقیت ایجاد شد!`);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'خطا در ایجاد محصولات';
      toast.error(message);
    },
  });
};