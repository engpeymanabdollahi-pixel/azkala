import apiClient from './client';

// ==================== Types ====================

export interface ReviewUser {
  id: number;
  name: string;
  initial: string;
}

export interface Review {
  id: number;
  user: ReviewUser;
  title: string | null;
  comment: string;
  rating: number;
  is_verified: boolean;
  // ✅ این سه فیلد واقعاً توسط ReviewController::index() برگردانده می‌شوند
  // ولی قبلاً در تایپ فرانت نبودند (باعث TS2339 در ReviewsTab.tsx می‌شدند).
  is_pending: boolean;
  is_own_review: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  // ✅ پاسخ ادمین (که واقعاً در پنل مدیریت ثبت می‌شود) — قبلاً هیچ‌وقت از
  // بکند برنمی‌گشت، حالا با ReviewController::index() همراه می‌آید.
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  created_at_fa: string;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface ReviewsSummary {
  average_rating: number;
  total_reviews: number;
  distribution: RatingDistribution[];
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    summary: ReviewsSummary;
  };
}

export interface CreateReviewRequest {
  product_id: number;
  rating: number;
  title?: string;
  comment: string;
}

export interface CanReviewResponse {
  success: boolean;
  data: {
    can_review: boolean;
    has_reviewed: boolean;
    has_purchased: boolean;
  };
}

// ==================== Service ====================

export const reviewService = {
  /**
   * دریافت نظرات یک محصول
   * ✅ پارامتر page به صورت عدد ساده
   * ✅ پارامتر rating اختیاری — قبلاً فیلتر ستاره در فرانت فقط همان یک
   * صفحهٔ بارگذاری‌شده را در سمت کلاینت فیلتر می‌کرد؛ حالا واقعاً از
   * بکند فیلتر می‌شود.
   */
  async getReviews(productId: number, page: number = 1, rating?: number): Promise<ReviewsResponse> {
    try {
      const response = await apiClient.get<ReviewsResponse>(
        `/products/${productId}/reviews`,
        { params: { page, ...(rating ? { rating } : {}) } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // برگرداندن ساختار خالی در صورت خطا
      return {
        success: false,
        data: {
          reviews: [],
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
          },
          summary: {
            average_rating: 0,
            total_reviews: 0,
            distribution: [
              { rating: 5, count: 0 },
              { rating: 4, count: 0 },
              { rating: 3, count: 0 },
              { rating: 2, count: 0 },
              { rating: 1, count: 0 },
            ],
          },
        },
      };
    }
  },

  /**
   * ثبت نظر جدید
   */
  async createReview(data: CreateReviewRequest): Promise<{
    success: boolean;
    message: string;
    data: Review;
  }> {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  /**
   * حذف نظر
   */
  async deleteReview(reviewId: number): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  /**
   * ثبت "مفید بود"
   */
  async markHelpful(reviewId: number): Promise<{
    success: boolean;
    message: string;
    data: { helpful_count: number };
  }> {
    const response = await apiClient.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },

  /**
   * بررسی امکان ثبت نظر
   */
  async canReview(productId: number): Promise<CanReviewResponse> {
    try {
      const response = await apiClient.get<CanReviewResponse>(
        `/products/${productId}/can-review`
      );
      return response.data;
    } catch (error) {
      console.error('Error checking can-review:', error);
      // اگر خطا داد (مثلاً کاربر لاگین نیست)، مقدار پیش‌فرض برگردان
      return {
        success: false,
        data: {
          can_review: false,
          has_reviewed: false,
          has_purchased: false,
        },
      };
    }
  },
};