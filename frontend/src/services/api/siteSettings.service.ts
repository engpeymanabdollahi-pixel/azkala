import apiClient from '@/services/api/client';

// ✅ شکل واقعی پاسخ GET /site-settings (routes/api.php) — دقیقاً همان
// کلیدهایی که آن route از جدول settings whitelist می‌کند.
export interface SiteSettings {
  // General
  site_name?: string;
  site_logo?: string | null;
  site_favicon?: string | null;
  support_phone?: string;
  support_email?: string;
  address?: string;
  working_hours?: string;
  primary_color?: string;
  accent_color?: string;
  // Social
  instagram_url?: string;
  telegram_url?: string;
  twitter_url?: string;
  about_text?: string;
  // Legal
  enamad_code?: string;
  samandehi_code?: string;
  // ✅ Marketing - Announcement Bar
  announcement_enabled?: string | boolean;
  announcement_text?: string;
  announcement_link?: string;
  announcement_bg_color?: 'gradient' | 'primary' | 'dark' | 'success' | string;
  announcement_show_live_users?: string | boolean;
  // Seller Request
  seller_request_bg_image?: string;
}

export const siteSettingsService = {
  getSiteSettings: async (): Promise<SiteSettings> => {
    const response = await apiClient.get('/site-settings');
    return response.data?.data || {};
  },
};