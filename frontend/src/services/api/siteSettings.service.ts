import apiClient from '@/services/api/client';

// ✅ شکل واقعی پاسخ GET /site-settings (routes/api.php) — دقیقاً همان
// کلیدهایی که آن route از جدول settings whitelist می‌کند.
export interface SiteSettings {
  site_name?: string;
  site_logo?: string | null;
  site_favicon?: string | null;
  support_phone?: string;
  support_email?: string;
  address?: string;
  working_hours?: string;
  instagram_url?: string;
  telegram_url?: string;
  twitter_url?: string;
  about_text?: string;
  enamad_code?: string;
  samandehi_code?: string;
}

export const siteSettingsService = {
  getSiteSettings: async (): Promise<SiteSettings> => {
    const response = await apiClient.get('/site-settings');
    return response.data?.data || {};
  },
};
