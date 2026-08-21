import client from './client';

// ==================== Types ====================

export interface AdminAccessLogEntry {
  id: number;
  actor_user_id: number | null;
  target_user_id: number | null;
  action: 'admin_role_assigned' | 'admin_role_removed' | 'permission_granted' | 'permission_revoked';
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  updated_at: string;
  actor: {
    id: number;
    name: string;
    email: string | null;
    phone: string;
  } | null;
  target: {
    id: number;
    name: string;
    email: string | null;
    phone: string;
  } | null;
}

export interface AdminAccessLogsFilters {
  per_page?: number;
  page?: number;
  actor_user_id?: number | null;
  target_user_id?: number | null;
  action?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  sort?: 'asc' | 'desc';
}

export interface AdminAccessLogsPage {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminAccessLogsResponse {
  success: boolean;
  data: AdminAccessLogEntry[];
  meta: AdminAccessLogsPage;
}

export interface AdminAccessActionsResponse {
  success: boolean;
  data: Record<string, string>;
}

// ==================== API ====================

export const adminAccessLogsService = {
  /**
   * دریافت لیست لاگ‌ها با pagination و فیلتر.
   */
  async list(filters: AdminAccessLogsFilters = {}): Promise<AdminAccessLogsResponse> {
    const params: Record<string, string | number> = {};

    if (filters.per_page) params.per_page = filters.per_page;
    if (filters.page) params.page = filters.page;
    if (filters.actor_user_id) params.actor_user_id = filters.actor_user_id;
    if (filters.target_user_id) params.target_user_id = filters.target_user_id;
    if (filters.action) params.action = filters.action;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.sort) params.sort = filters.sort;

    const response = await client.get('/admin/access-logs', { params });
    return response.data;
  },

  /**
   * دریافت لیست action ها (برای dropdown فیلتر).
   */
  async actions(): Promise<AdminAccessActionsResponse> {
    const response = await client.get('/admin/access-logs/actions');
    return response.data;
  },
};