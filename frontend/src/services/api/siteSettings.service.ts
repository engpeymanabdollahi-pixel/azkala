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
  // ✅ متن‌های حقوقی قابل‌ویرایش از پنل ادمین — اگر خالی باشند، صفحات
  // مربوطه (Terms/Privacy/Guarantee/SellerAgreement) از متن پیش‌فرض
  // hardcoded خودشان استفاده می‌کنند.
  terms_text?: string;
  privacy_text?: string;
  warranty_text?: string;
  seller_terms_text?: string;
  // ✅ Marketing - Announcement Bar
  announcement_enabled?: string | boolean;
  announcement_text?: string;
  announcement_link?: string;
  announcement_bg_color?: 'gradient' | 'primary' | 'dark' | 'success' | string;
  announcement_show_live_users?: string | boolean;
  // Seller Request
  seller_request_bg_image?: string;
  // ✅ Shipping — برای صفحه‌ی روش‌ها و هزینه‌ی ارسال (/shipping)
  post_pishtaz_enabled?: string | boolean;
  post_pishtaz_cost?: string;
  tipax_enabled?: string | boolean;
  tipax_cost?: string;
  free_shipping_enabled?: string | boolean;
  free_shipping_min_amount?: string;
  express_delivery_enabled?: string | boolean;
  express_delivery_cost?: string;
}

export const siteSettingsService = {
  getSiteSettings: async (): Promise<SiteSettings> => {
    const response = await apiClient.get('/site-settings');
    return response.data?.data || {};
  },
};