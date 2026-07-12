import apiClient from './client';

export interface Setting {
  id: number;
  key: string;
  value: any;
  group: string;
  type: 'text' | 'number' | 'boolean' | 'json' | 'file' | 'color' | 'email' | 'url' | 'textarea';
  label: string;
  description?: string;
  is_locked: boolean;
  is_sensitive: boolean;
  updated_by?: number;
  updated_at?: string;
}

export interface SettingHistory {
  id: number;
  setting_key: string;
  group: string;
  label?: string;
  old_value: string;
  new_value: string;
  note?: string;
  changed_by?: { id: number; name: string };
  created_at: string;
}

export interface SettingsResponse {
  success: boolean;
  data: {
    settings: Record<string, Setting[]>;
    stats: {
      total: number;
      groups: number;
      locked: number;
      sensitive: number;
      today_changes: number;
    };
  };
}

export interface HistoryResponse {
  success: boolean;
  data: {
    histories: SettingHistory[];
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
    };
  };
}

export const adminSettingService = {
  async getSettings(group?: string, search?: string): Promise<SettingsResponse> {
    const params = new URLSearchParams();
    if (group) params.append('group', group);
    if (search) params.append('search', search);
    const url = params.toString() ? `/admin/settings?${params}` : '/admin/settings';
    const response = await apiClient.get<SettingsResponse>(url);
    return response.data;
  },

  async updateGroup(group: string, settings: Array<{ key: string; value: any }>, note?: string) {
    const response = await apiClient.post(`/admin/settings/update-group/${group}`, {
      settings,
      note,
    });
    return response.data;
  },

  async updateSetting(key: string, value: any, note?: string) {
    const response = await apiClient.put(`/admin/settings/${key}`, { value, note });
    return response.data;
  },

  async toggleLock(key: string) {
    const response = await apiClient.post(`/admin/settings/${key}/toggle-lock`);
    return response.data;
  },

  async getHistory(group?: string, key?: string, page: number = 1): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (group) params.append('group', group);
    if (key) params.append('key', key);
    params.append('page', String(page));
    const response = await apiClient.get<HistoryResponse>(`/admin/settings/history?${params}`);
    return response.data;
  },

  async rollback(historyId: number) {
    const response = await apiClient.post(`/admin/settings/rollback/${historyId}`);
    return response.data;
  },

  async export(group?: string) {
    const params = group ? `?group=${group}` : '';
    const response = await apiClient.get(`/admin/settings/export${params}`);
    return response.data;
  },

  async import(settings: Array<{ key: string; value: any }>) {
    const response = await apiClient.post('/admin/settings/import', { settings });
    return response.data;
  },

  async testSmtp() {
    const response = await apiClient.post('/admin/settings/test-smtp');
    return response.data;
  },

  async testSms() {
    const response = await apiClient.post('/admin/settings/test-sms');
    return response.data;
  },

  async seedDefaults() {
    const response = await apiClient.post('/admin/settings/seed-defaults');
    return response.data;
  },
};