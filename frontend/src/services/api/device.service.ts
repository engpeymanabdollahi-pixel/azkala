import apiClient from '@/services/api/client';

// ✅ Device-First Architecture فاز ۱F/۱H: خانواده‌ی دستگاه (Smartphone/
// Laptop/Tablet/...) — تنها منبع اکوسیستم دستگاه، داده‌محور و بدون هیچ
// enum ثابتی در فرانت‌اند. افزودن یک خانواده‌ی جدید از ادمین، بدون هیچ
// تغییر کدی، خودش اینجا ظاهر می‌شود.
export interface DeviceFamily {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export interface DeviceBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

export interface DeviceSeries {
  id: number;
  name: string;
  slug: string;
  image?: string;
  brand_id: number;
}

export interface DeviceModel {
  id: number;
  name: string;
  slug: string;
  image?: string;
  series_id: number;
  brand_id: number;
}

// ✅ شکل واقعی پاسخ DeviceController::getHierarchy — قبلاً این تایپ اصلاً
// تعریف نشده بود (خطای «Cannot find name» در tsc، فقط چون npm run build
// از esbuild استفاده می‌کند نه tsc کامل، از چشم build عادی دور مانده بود).
export interface DeviceModelWithBrand {
  id: number;
  name: string;
  brand?: { name: string };
}

export const deviceService = {
  // ✅ فاز ۱F: لیست عمومی خانواده‌های فعالِ دستگاه.
  getFamilies: async (): Promise<DeviceFamily[]> => {
    const response = await apiClient.get('/device-families');
    return response.data.data || [];
  },

  getBrands: async (): Promise<DeviceBrand[]> => {
    const response = await apiClient.get('/devices/brands');
    return response.data.data || [];
  },

  getSeries: async (brandId: number): Promise<DeviceSeries[]> => {
    const response = await apiClient.get(`/devices/brands/${brandId}/series`);
    return response.data.data || [];
  },

  getModels: async (seriesId: number): Promise<DeviceModel[]> => {
    const response = await apiClient.get(`/devices/series/${seriesId}/models`);
    return response.data.data || [];
  },
    // ✅ دریافت سلسله‌مراتب به صورت یکجا (بسیار سریع‌تر و مطمئن‌تر)
  getHierarchy: async (): Promise<DeviceModelWithBrand[]> => {
    const response = await apiClient.get('/devices/hierarchy');
    return response.data.data || [];
  },
    // ✅ دریافت ساختار درختی برای هدر سایت
  getHeaderHierarchy: async () => {
    const response = await apiClient.get('/devices/header-hierarchy');
    return response.data.data || [];
  },
};