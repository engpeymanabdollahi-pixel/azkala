import apiClient from '@/services/api/client';

export interface UploadResponse {
  success: boolean;
  urls: string[];
  message?: string;
}

/**
 * آپلود تصاویر به سرور
 * @param files آرایه فایل‌های تصویری
 * @returns آرایه URLهای آپلود شده
 */
export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  
  // اضافه کردن هر فایل به FormData
  files.forEach((file) => {
    formData.append('images[]', file);
  });

  try {
    const response = await apiClient.post<UploadResponse>('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success && response.data.urls) {
      return response.data.urls;
    }

    throw new Error(response.data.message || 'آپلود ناموفق بود');
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    const message = err.response?.data?.message || 'خطا در آپلود تصاویر';
    throw new Error(message);
  }
};