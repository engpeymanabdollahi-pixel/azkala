import { Shield } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/**
 * ✅ قبلاً این بخش سه نماد ثابت («اینماد»، «ساماندهی»، «زرین‌پال») را بدون
 * هیچ کد تایید یا لینک قابل‌استعلامی نشان می‌داد — یعنی سه ادعای رسمی و
 * قابل‌استعلام (دو تای اول نمادهای دولتی، سومی یک درگاه پرداخت که اصلاً در
 * بک‌اند وصل نیست؛ هیچ سرویس Zarinpal ای در کد پروژه پیاده‌سازی نشده) بدون
 * هیچ راهی برای کاربر جهت راستی‌آزمایی. حالا هر نماد فقط وقتی نمایش داده
 * می‌شود که کدِ واقعی‌اش در تنظیمات سایت وارد شده باشد، و به صفحه‌ی رسمیِ
 * استعلام لینک می‌شود. تا وقتی کدی تنظیم نشده، این بخش کلاً رندر نمی‌شود.
 */
interface CertificateBadge {
  key: string;
  href: string;
  label: string;
  title: string;
  color: string;
}

export function TrustCertificates() {
  const { data: settings } = useSiteSettings();

  const certificates: CertificateBadge[] = [];

  if (settings?.enamad_code) {
    certificates.push({
      key: 'enamad',
      href: `https://inspect.enamad.ir/?id=${encodeURIComponent(settings.enamad_code)}`,
      label: 'نماد',
      title: 'اینماد',
      color: 'from-blue-500 to-blue-600',
    });
  }

  if (settings?.samandehi_code) {
    certificates.push({
      key: 'samandehi',
      href: `https://logo.samandehi.ir/Verify.aspx?id=${encodeURIComponent(settings.samandehi_code)}`,
      label: 'نماد',
      title: 'ساماندهی',
      color: 'from-green-500 to-green-600',
    });
  }

  if (certificates.length === 0) return null;

  return (
    <div className="border-t border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {certificates.map((cert) => (
            <a
              key={cert.key}
              href={cert.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-gray-800 hover:border-primary-500/50 hover:bg-white/10 transition-all duration-300"
              aria-label={`استعلام ${cert.title}`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${cert.color} rounded-xl flex items-center justify-center`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{cert.label}</p>
                <p className="text-sm text-white font-bold">{cert.title}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
