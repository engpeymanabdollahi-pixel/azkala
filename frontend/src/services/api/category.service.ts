import apiClient from './client';
// ✅ این فایل قبلاً یک اینترفیس Category جدا و ناقص (بدون type، is_active و...)
// تعریف می‌کرد که هم‌نام ولی ساختاراً ناسازگار با Category واقعیِ
// @/types/models بود — همان تایپی که بقیه‌ی ProductsPage (FilterSidebar،
// Toolbar، FilterTags، MobileFilterDrawer) استفاده می‌کنند. همین دوگانگی
// باعث خطای کامپایل هنگام تایپ کردن نتیجه‌ی categoryService.getAll() به
// عنوان Category[] واقعی می‌شد.
import type { Category } from '@/types/models';

export type { Category };

export const categoryService = {
  // ✅ Marketplace Unification فاز C2: familyId اختیاری — وقتی داده شود
  // بک‌اند فقط دسته‌های همان اکوسیستم + دسته‌های سراسری را برمی‌گرداند.
  async getAll(familyId?: number): Promise<{ success: boolean; data: Category[] }> {
    const params = new URLSearchParams({ with_products_count: '1' });
    if (familyId) params.set('family_id', String(familyId));
    const response = await apiClient.get(`/categories?${params.toString()}`);
    return response.data;
  },

  async getCategories(withProductsCount = true): Promise<{ success: boolean; data: Category[] }> {
    const params = withProductsCount ? '?with_products_count=1' : '';
    const response = await apiClient.get(`/categories${params}`);
    return response.data;
  },

  async getCategory(id: number): Promise<{ success: boolean; data: Category }> {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
};