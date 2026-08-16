import apiClient from './client';

export interface Address {
  id: number;
  user_id: number;
  title: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code: string | null;
  is_default: boolean;
  // ✅ Nearby Stores Completion Phase — کاملاً اختیاری؛ فقط برای استفاده‌ی
  // صریح کاربر به‌عنوان منبع مکان جستجوی «فروشگاه‌های نزدیک». هیچ ارتباطی
  // با Checkout ندارد.
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  title: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code?: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AddressesResponse {
  success: boolean;
  data: Address[];
}

export interface AddressResponse {
  success: boolean;
  message: string;
  data: Address;
}

export const addressService = {
  /**
   * دریافت لیست آدرس‌های کاربر
   */
  async getAddresses(): Promise<AddressesResponse> {
    const response = await apiClient.get<AddressesResponse>('/addresses');
    return response.data;
  },

  /**
   * افزودن آدرس جدید
   */
  async createAddress(data: AddressFormData): Promise<AddressResponse> {
    const response = await apiClient.post<AddressResponse>('/addresses', data);
    return response.data;
  },

  /**
   * ویرایش آدرس
   */
  async updateAddress(id: number, data: Partial<AddressFormData>): Promise<AddressResponse> {
    const response = await apiClient.put<AddressResponse>(`/addresses/${id}`, data);
    return response.data;
  },

  /**
   * حذف آدرس
   */
  async deleteAddress(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/addresses/${id}`);
    return response.data;
  },

  /**
   * تنظیم آدرس به عنوان پیش‌فرض
   */
  async setDefault(id: number): Promise<AddressResponse> {
    const response = await apiClient.put<AddressResponse>(`/addresses/${id}/default`);
    return response.data;
  },
};