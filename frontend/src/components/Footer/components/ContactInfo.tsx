import { Phone, Mail, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function ContactInfo() {
  // ✅ قبلاً همین کوئری اینجا و در Header/index.tsx و Footer/AboutSection.tsx
  // به‌طور جداگانه کپی شده بود — هوک مشترک، هم کد تکراری را حذف می‌کند هم
  // یک تایپ واقعی (نه any ضمنی) به settings می‌دهد.
  const { data: settings } = useSiteSettings();

  const contactItems = [
    {
      label: 'تلفن پشتیبانی',
      value: settings?.support_phone || '021-12345678',
      icon: Phone,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'ایمیل پشتیبانی',
      value: settings?.support_email || 'support@azkala.com',
      icon: Mail,
      color: 'from-red-500 to-red-600',
    },
    {
      label: 'آدرس فروشگاه',
      value: settings?.address || 'آدرس ثبت نشده است',
      icon: MapPin,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div>
      <h3 className="font-bold text-white mb-5 text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full"></span>
        اطلاعات تماس
      </h3>
      <ul className="space-y-4">
        {contactItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex items-start gap-3 text-sm text-gray-400 group">
              <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-white font-semibold leading-relaxed">{item.value}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ساعات پشتیبانی داینامیک */}
      <div className="mt-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <p className="text-xs text-gray-400 font-semibold">ساعات پشتیبانی</p>
        </div>
        <p className="text-sm text-white font-bold mb-1">
          {settings?.working_hours || 'شنبه تا پنجشنبه ۹ تا ۱۸'}
        </p>
      </div>
    </div>
  );
}