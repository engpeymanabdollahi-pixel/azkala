import apiClient from './client';

export interface ReviewUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface ReviewProduct {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

export interface AdminReview {
  id: number;
  title: string;
  comment: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  helpful_count: number;
  images?: string[];
  admin_reply?: string;
  replied_at?: string;
  user?: ReviewUser;
  product?: ReviewProduct;
  created_at: string;
}

export interface AdminReviewsResponse {
  success: boolean;
  data: {
    reviews: AdminReview[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
      average_rating: number;
      verified: number;
      today: number;
    };
  };
}

export interface ReviewFilters {
  search?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rating?: number;
  product_id?: number;
  is_verified?: boolean;
  sort_by?: 'created_at' | 'rating' | 'helpful_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const adminReviewService = {
  async getReviews(filters: ReviewFilters = {}): Promise<AdminReviewsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get<AdminReviewsResponse>(`/admin/reviews?${params}`);
    return response.data;
  },

  async updateStatus(id: number, status: string) {
    const response = await apiClient.put(`/admin/reviews/${id}/status`, { status });
    return response.data;
  },

  async reply(id: number, reply: string) {
    const response = await apiClient.post(`/admin/reviews/${id}/reply`, { reply });
    return response.data;
  },

  async deleteReview(id: number) {
    const response = await apiClient.delete(`/admin/reviews/${id}`);
    return response.data;
  },

  async bulkAction(ids: number[], action: 'approve' | 'reject' | 'delete') {
    const response = await apiClient.post('/admin/reviews/bulk-action', { ids, action });
    return response.data;
  },
};