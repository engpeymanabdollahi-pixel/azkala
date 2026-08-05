import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/client';

export interface SellerDashboardStats {
  total_revenue: number;
  pending_orders: number;
  active_products: number;
  total_products: number;
  pending_settlements: number;
  total_sales: number;
  monthly_sales: { month: string; sales: number; revenue: number }[];
  top_products: { id: number; name: string; sales: number; revenue: number; image?: string }[];
}

const fetchSellerDashboardStats = async (): Promise<SellerDashboardStats> => {
  const response = await apiClient.get('/seller/dashboard/stats');
  return response.data.data;
};

/**
 * همان queryKey ('seller-dashboard-stats') که SellerDashboard.tsx مستقیم
 * استفاده می‌کند — یعنی وقتی هدر و داشبورد هر دو باز باشند، TanStack Query
 * فقط یک درخواست واقعی می‌زند، نه دو تا.
 */
export function useSellerDashboardStats() {
  return useQuery({
    queryKey: ['seller-dashboard-stats'],
    queryFn: fetchSellerDashboardStats,
    staleTime: 60_000,
  });
}
