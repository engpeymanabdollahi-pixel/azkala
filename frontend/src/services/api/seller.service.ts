import apiClient from './client';

export const sellerService = {
  updateSettings: async (formData: FormData) => {
    // ⚠️ هشدار: اگر خط زیر (headers) وجود دارد، حتماً آن را پاک کنید.
    // Axios باید خودش هدر را با boundary صحیح تنظیم کند.
    const response = await apiClient.post('/seller/settings', formData);
    return response.data;
  },
};