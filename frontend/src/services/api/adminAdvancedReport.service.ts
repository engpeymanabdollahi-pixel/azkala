import apiClient from './client';

export interface UsersAnalysisResponse {
  success: boolean;
  data: {
    new_vs_returning: { new: number; returning: number };
    by_frequency: {
      no_purchase: number;
      single: number;
      occasional: number;
      regular: number;
      vip: number;
    };
    by_value: {
      no_purchase: number;
      low: number;
      medium: number;
      high: number;
      premium: number;
    };
    retention_rate: number;
    total_customers: number;
  };
}

export interface SellerData {
  id: number;
  name: string;
  shop_name?: string;
  avatar?: string;
  rating: number;
  products_count: number;
  total_sold: number;
  total_revenue: number;
  orders_count: number;
  rank: number;
  performance: number;
}

export interface SellerPerformanceResponse {
  success: boolean;
  data: {
    sellers: SellerData[];
    averages: {
      revenue: number;
      sold: number;
      rating: number;
    };
    total_sellers: number;
  };
}

export interface PeriodComparisonResponse {
  success: boolean;
  data: {
    current: {
      orders: number;
      revenue: number;
      users: number;
      products: number;
    };
    previous: {
      orders: number;
      revenue: number;
      users: number;
      products: number;
    };
    changes: {
      orders: number;
      revenue: number;
      users: number;
      products: number;
    };
  };
}

export interface DeviceAnalyticsResponse {
  success: boolean;
  data: {
    by_brand: Array<{ device_brand: string; count: number }>;
    by_model: Array<{ device_model: string; count: number }>;
    by_type: Array<{ device_type: string; count: number }>;
    message?: string;
  };
}

export interface BasketAnalysisResponse {
  success: boolean;
  data: {
    avg_items_per_order: number;
    avg_order_value: number;
    frequently_bought: Array<{
      product_id: number;
      product_name: string;
      frequency: number;
    }>;
  };
}

export interface Prediction {
  date: string;
  predicted_revenue: number;
  confidence: number;
}

export interface PredictionsResponse {
  success: boolean;
  data: {
    predictions: Prediction[];
    current_avg: number;
    trend: 'up' | 'down' | 'stable';
    trend_percentage: number;
    historical_count: number;
  };
}

export interface Anomaly {
  date: string;
  revenue: number;
  orders_count: number;
  deviation: number;
  deviation_percentage: number;
  type: 'spike' | 'drop';
}

export interface AnomaliesResponse {
  success: boolean;
  data: {
    anomalies: Anomaly[];
    statistics: {
      mean: number;
      std_dev: number;
      threshold: number;
    };
  };
}

export interface ProductAnalyticsResponse {
  success: boolean;
  data: {
    most_viewed: any[];
    best_selling: any[];
    low_stock: any[];
    high_conversion: any[];
  };
}

export const adminAdvancedReportService = {
  async getUsersAnalysis(period: number = 30): Promise<UsersAnalysisResponse> {
    const response = await apiClient.get<UsersAnalysisResponse>(`/admin/advanced-reports/users-analysis?period=${period}`);
    return response.data;
  },

  async getSellerPerformance(period: number = 30): Promise<SellerPerformanceResponse> {
    const response = await apiClient.get<SellerPerformanceResponse>(`/admin/advanced-reports/seller-performance?period=${period}`);
    return response.data;
  },

  async getPeriodComparison(period: number = 30): Promise<PeriodComparisonResponse> {
    const response = await apiClient.get<PeriodComparisonResponse>(`/admin/advanced-reports/period-comparison?period=${period}`);
    return response.data;
  },

  async getDeviceAnalytics(period: number = 30): Promise<DeviceAnalyticsResponse> {
    const response = await apiClient.get<DeviceAnalyticsResponse>(`/admin/advanced-reports/device-analytics?period=${period}`);
    return response.data;
  },

  async getBasketAnalysis(period: number = 30): Promise<BasketAnalysisResponse> {
    const response = await apiClient.get<BasketAnalysisResponse>(`/admin/advanced-reports/basket-analysis?period=${period}`);
    return response.data;
  },

  async getPredictions(days: number = 7): Promise<PredictionsResponse> {
    const response = await apiClient.get<PredictionsResponse>(`/admin/advanced-reports/predictions?days=${days}`);
    return response.data;
  },

  async getAnomalies(period: number = 30): Promise<AnomaliesResponse> {
    const response = await apiClient.get<AnomaliesResponse>(`/admin/advanced-reports/anomalies?period=${period}`);
    return response.data;
  },

  async getProductAnalytics(period: number = 30): Promise<ProductAnalyticsResponse> {
    const response = await apiClient.get<ProductAnalyticsResponse>(`/admin/advanced-reports/product-analytics?period=${period}`);
    return response.data;
  },
async getChatAnalytics(period: number) {
  const response = await apiClient.get('/admin/advanced-reports/chat-analytics', {
    params: { period },
  });
  return response.data;
},
};
