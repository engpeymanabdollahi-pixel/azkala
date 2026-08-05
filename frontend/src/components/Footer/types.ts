import type { ComponentType } from 'react';

export interface TrustBadge {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
}

export interface QuickLink {
  id: string;
  label: string;
}

export interface ServiceLink {
  label: string;
  path: string;
}

// ✅ TrustCertificate قبلاً اینجا بود؛ TrustCertificates.tsx حالا شکل داده‌ی
// خودش را مستقیماً از useSiteSettings می‌سازد (رجوع به کامنت آن فایل).

// ✅ ContactInfo و SocialLink قبلاً اینجا بودند، ولی هیچ‌کدام مصرف‌کننده‌ی
// واقعی نداشتند: کامپوننت‌های واقعی (ContactInfo.tsx و SocialLinks.tsx)
// از اول شکل داده‌ی محلی خودشان را داشتند و این تایپ‌ها را هیچ‌وقت ایمپورت
// نمی‌کردند — یعنی دو پیاده‌سازی کاملاً موازی و ازهم‌عقب‌افتاده (constants.ts
// شماره تلفن/آدرس/ساعات کاری متفاوتی داشت با چیزی که واقعاً رندر می‌شد).