import apiClient from '@/services/api/client';

export interface CreateProductData {
  name: string;
  description: string;
  short_description?: string;
  price: number;
  discount_price?: number;
  stock: number;
  category_id: number;
  brand_id?: number;
  sku?: string;
  is_active?: boolean;
  is_featured?: boolean;
  main_image?: string;
  gallery?: string[];
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: string;
  discount_price?: string;
  stock: number;
  category_id: number;
  brand_id?: number;
  sku?: string;
  main_image?: string;
  gallery?: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  brand?: {
    id: number;
    name: string;
  } | null;
}

export interface ProductListResponse {
  current_page: number;
  data: Product[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

/**
 * دریافت لیست محصولات فروشنده
 */
export const getSellerProducts = async (page = 1, perPage = 10): Promise<ProductListResponse> => {
  const response = await apiClient.get<{ success: boolean; data: ProductListResponse }>(
    '/seller/products',
    { params: { page, per_page: perPage } }
  );
  return response.data.data;
};

/**
 * ثبت محصول جدید
 */
export const createProduct = async (data: CreateProductData): Promise<Product> => {
  const response = await apiClient.post<{ success: boolean; data: Product }>(
    '/seller/products',
    data
  );
  return response.data.data;
};

/**
 * دریافت یک محصول
 */
export const getProduct = async (id: number): Promise<Product> => {
  const response = await apiClient.get<{ success: boolean; data: Product }>(
    `/seller/products/${id}`
  );
  return response.data.data;
};

/**
 * به‌روزرسانی محصول
 */
export const updateProduct = async (id: number, data: Partial<CreateProductData>): Promise<Product> => {
  const response = await apiClient.put<{ success: boolean; data: Product }>(
    `/seller/products/${id}`,
    data
  );
  return response.data.data;
};

/**
 * حذف محصول
 */
export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/seller/products/${id}`);
};