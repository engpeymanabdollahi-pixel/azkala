import apiClient from './client';

export interface KpiData {
  current: number;
  previous: number;
  change: number;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    period: number;
    kpis: {
      orders: KpiData;
      revenue: KpiData;
      avg_order: KpiData;
      users: KpiData;
    };
  };
}

export interface ChartDataPoint {
  date: string;
  date_fa: string;
  orders_count: number;
  revenue: number;
  avg_order: number;
}

export interface SalesChartResponse {
  success: boolean;
  data: {
    chart: ChartDataPoint[];
    summary: {
      total_orders: number;
      total_revenue: number;
      avg_daily_orders: number;
      avg_daily_revenue: number;
      max_day: ChartDataPoint | null;
      min_day: ChartDataPoint | null;
    };
  };
}

export interface TopProduct {
  id: number;
  name: string;
  slug: string;
  image?: string;
  total_sold: number;
  total_revenue: number;
  orders_count: number;
}

export interface TopCategory {
  id: number;
  name: string;
  slug: string;
  total_sold: number;
  total_revenue: number;
}

export interface TopSeller {
  id: number;
  name: string;
  shop_name?: string;
  avatar?: string;
  products_count: number;
  total_sold: number;
  total_revenue: number;
  rating: number;
}

export interface OverviewResponse {
  success: boolean;
  data: {
    total_users: number;
    total_products: number;
    total_orders: number;
    total_revenue: number;
    total_reviews: number;
    active_products: number;
    low_stock_products: number;
    out_of_stock: number;
  };
}

export const adminReportService = {
  async getOverview(): Promise<OverviewResponse> {
    const response = await apiClient.get<OverviewResponse>('/admin/reports/overview');
    return response.data;
  },

  async getDashboard(period: number = 30): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardResponse>(`/admin/reports/dashboard?period=${period}`);
    return response.data;
  },

  async getSalesChart(period: number = 30): Promise<SalesChartResponse> {
    const response = await apiClient.get<SalesChartResponse>(`/admin/reports/sales-chart?period=${period}`);
    return response.data;
  },

  async getTopProducts(period: number = 30, limit: number = 10) {
    const response = await apiClient.get(`/admin/reports/top-products?period=${period}&limit=${limit}`);
    return response.data;
  },

  async getTopCategories(period: number = 30) {
    const response = await apiClient.get(`/admin/reports/top-categories?period=${period}`);
    return response.data;
  },

  async getOrderStatus(period: number = 30) {
    const response = await apiClient.get(`/admin/reports/order-status?period=${period}`);
    return response.data;
  },

  async getTopSellers(period: number = 30) {
    const response = await apiClient.get(`/admin/reports/top-sellers?period=${period}`);
    return response.data;
  },
};