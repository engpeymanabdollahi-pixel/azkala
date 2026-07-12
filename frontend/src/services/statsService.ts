// src/services/statsService.ts
const USE_MOCK = true;

export const statsService = {
  getSellerStats: async () => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        data: {
          total_sales: 12500000,
          total_orders: 142,
          pending_orders: 8,
          active_products: 45,
          total_revenue: 8750000,
          pending_settlements: 3500000,
        },
      };
    }
    throw new Error('API not implemented yet');
  },
};