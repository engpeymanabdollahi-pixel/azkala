import apiClient from './client';

export interface SellerRating {
  id: number;
  user: {
    id: number;
    name: string;
    avatar?: string;
  };
  product_quality: number;
  shipping_speed: number;
  communication: number;
  overall_rating: number;
  comment?: string;
  created_at: string;
}

export interface SellerRatingStats {
  total_ratings: number;
  avg_product_quality: number;
  avg_shipping_speed: number;
  avg_communication: number;
  avg_overall: number;
}

export interface SellerRatingsResponse {
  success: boolean;
  data: {
    ratings: SellerRating[];
    stats: SellerRatingStats;
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

export interface CanRateResponse {
  success: boolean;
  data: {
    can_rate: boolean;
    has_rated: boolean;
    order?: {
      id: number;
      seller_id: number;
    };
  };
}

export interface RateSellerRequest {
  seller_id: number;
  order_id: number;
  product_quality: number;
  shipping_speed: number;
  communication: number;
  comment?: string;
}

export const adminSellerRatingService = {
  async getSellerRatings(sellerId: number, page: number = 1): Promise<SellerRatingsResponse> {
    const response = await apiClient.get<SellerRatingsResponse>(
      `/seller-ratings/seller/${sellerId}?page=${page}`
    );
    return response.data;
  },

  async canRate(orderId: number): Promise<CanRateResponse> {
    const response = await apiClient.get<CanRateResponse>(
      `/seller-ratings/can-rate/${orderId}`
    );
    return response.data;
  },

  async rateSeller(data: RateSellerRequest) {
    const response = await apiClient.post('/seller-ratings', data);
    return response.data;
  },
};