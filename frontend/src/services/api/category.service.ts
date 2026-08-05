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
  async getAll(): Promise<{ success: boolean; data: Category[] }> {
    const response = await apiClient.get('/categories?with_products_count=1');
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