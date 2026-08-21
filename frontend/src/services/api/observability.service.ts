import client from './client';

// ==================== Types ====================

export interface ObservabilityStats {
  security_today: number;
  payment_today: number;
  failed_logins_today: number;
  rate_limits_today: number;
  orders_today: number;
  admin_access_total: number;
}

export interface LogEntry {
  timestamp: string;
  environment: string;
  level: string;
  message: string;
  event?: string;
  channel?: string;
  user_id?: number | null;
  request_id?: string | null;
  ip?: string | null;
  [key: string]: unknown;
}

export interface ObservabilityResponse {
  success: boolean;
  data: LogEntry[] | ObservabilityStats | string[];
  meta?: {
    total?: number;
    channel?: string;
    request_id?: string;
  };
}

export interface ObservabilityFilters {
  limit?: number;
  event?: string | null;
  date_from?: string | null;
  date_to?: string | null;
}

// ==================== API ====================

export const observabilityService = {
  /**
   * آمار خلاصه برای stats cards.
   */
  async stats(): Promise<ObservabilityStats> {
    const response = await client.get('/admin/observability/stats');
    return response.data.data;
  },

  /**
   * لیست رویدادهای امنیتی.
   */
  async security(filters: ObservabilityFilters = {}): Promise<ObservabilityResponse> {
    const params: Record<string, string | number> = {};
    if (filters.limit) params.limit = filters.limit;
    if (filters.event) params.event = filters.event;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    const response = await client.get('/admin/observability/security', { params });
    return response.data;
  },

  /**
   * لیست رویدادهای سفارش/پرداخت.
   */
  async payment(filters: ObservabilityFilters = {}): Promise<ObservabilityResponse> {
    const params: Record<string, string | number> = {};
    if (filters.limit) params.limit = filters.limit;
    if (filters.event) params.event = filters.event;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    const response = await client.get('/admin/observability/payment', { params });
    return response.data;
  },

  /**
   * لیست رویدادهای API.
   */
  async api(limit = 100): Promise<ObservabilityResponse> {
    const response = await client.get('/admin/observability/api', { params: { limit } });
    return response.data;
  },

  /**
   * لیست رویدادهای Queue.
   */
  async queue(limit = 100): Promise<ObservabilityResponse> {
    const response = await client.get('/admin/observability/queue', { params: { limit } });
    return response.data;
  },

  /**
   * جستجو بر اساس Request ID.
   */
  async searchByRequestId(requestId: string): Promise<ObservabilityResponse> {
    const response = await client.get('/admin/observability/search', {
      params: { request_id: requestId },
    });
    return response.data;
  },

  /**
   * لیست event های موجود در یک کانال.
   */
  async events(channel: 'security' | 'payment' | 'api' | 'queue'): Promise<string[]> {
    const response = await client.get('/admin/observability/events', {
      params: { channel },
    });
    return response.data.data;
  },
};