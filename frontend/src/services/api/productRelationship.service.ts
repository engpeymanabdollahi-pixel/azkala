import apiClient from './client';

// ✅ Marketplace Unification فاز A: مصرف‌کننده‌ی فرانت‌اند API «محصولات
// مکمل» که در فاز قبلی (Product Relationship Phase 2/3) کامل و تست‌شده
// ساخته شد ولی هیچ UI ای مصرفش نمی‌کرد.

export interface ProductRelationshipItem {
  id: number;
  sort_order: number;
  target_product: {
    id: number;
    name: string;
    slug: string;
    main_image: string | null;
  } | null;
}

export const sellerProductRelationshipService = {
  async list(productId: number): Promise<{ success: boolean; data: ProductRelationshipItem[] }> {
    const response = await apiClient.get(`/seller/products/${productId}/relationships`);
    return response.data;
  },

  async create(productId: number, targetProductId: number, sortOrder = 0) {
    const response = await apiClient.post(`/seller/products/${productId}/relationships`, {
      target_product_id: targetProductId,
      sort_order: sortOrder,
    });
    return response.data;
  },

  async remove(productId: number, relationshipId: number) {
    const response = await apiClient.delete(`/seller/products/${productId}/relationships/${relationshipId}`);
    return response.data;
  },
};

export const adminProductRelationshipService = {
  async list(productId: number): Promise<{ success: boolean; data: ProductRelationshipItem[] }> {
    const response = await apiClient.get(`/admin/products/${productId}/relationships`);
    return response.data;
  },

  async create(productId: number, targetProductId: number, sortOrder = 0) {
    const response = await apiClient.post(`/admin/products/${productId}/relationships`, {
      target_product_id: targetProductId,
      sort_order: sortOrder,
    });
    return response.data;
  },

  async remove(productId: number, relationshipId: number) {
    const response = await apiClient.delete(`/admin/products/${productId}/relationships/${relationshipId}`);
    return response.data;
  },
};
