import { useNavigate } from 'react-router-dom';
import { TrustBadgesBar } from './components/TrustBadgesBar';
import { AboutSection } from './components/AboutSection';
import { QuickLinks } from './components/QuickLinks';
import { CustomerService } from './components/CustomerService';
import { ContactInfo } from './components/ContactInfo';
import { TrustCertificates } from './components/TrustCertificates';
import { COPYRIGHT_YEAR } from './constants';

interface FooterProps {
  className?: string;
}

/**
 * کامپوننت Footer اصلی ازکالا
 * ماژولار و قابل نگهداری
 */
export function Footer({ className }: FooterProps) {
  const navigate = useNavigate();

  /**
   * مدیریت ناوبری یکپارچه
   * هم path و هم id را پشتیبانی می‌کند
   */
  const handleNavigate = (target: string) => {
    // اگر با / شروع شود، path است
    if (target.startsWith('/')) {
      navigate(target);
    } else {
      // در غیر این صورت، id صفحه است
      const routeMap: Record<string, string> = {
        home: '/',
        products: '/products',
        brands: '/brands',
        categories: '/categories',
        orders: '/dashboard/orders',
        wishlist: '/dashboard/wishlist',
        help: '/help',
        contact: '/contact',
        terms: '/terms',
        guarantee: '/guarantee',
      };
      navigate(routeMap[target] || '/');
    }
  };

  return (
    <footer className={`bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-300 mt-20 ${className || ''}`}>
      {/* نوار اعتماد بالا */}
      <TrustBadgesBar />

      {/* بخش اصلی Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* درباره ازکالا */}
          <AboutSection />

          {/* دسترسی سریع */}
          <QuickLinks onNavigate={handleNavigate} />

          {/* خدمات مشتریان */}
          <CustomerService onNavigate={handleNavigate} />

          {/* اطلاعات تماس */}
          <ContactInfo />
        </div>
      </div>

      {/* نمادهای اعتماد */}
      <TrustCertificates />

      {/* پایین صفحه - کپی‌رایت */}
      <div className="border-t border-gray-800 py-6 bg-black/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center md:text-right">
              © {COPYRIGHT_YEAR} <span className="text-primary-400 font-semibold">ازکالا</span> - تمام حقوق محفوظ است
            </p>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <button 
                onClick={() => handleNavigate('/terms')}
                className="hover:text-primary-400 transition-colors"
              >
                حریم خصوصی
              </button>
              <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              <button 
                onClick={() => handleNavigate('/terms')}
                className="hover:text-primary-400 transition-colors"
              >
                قوانین و مقررات
              </button>
              <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
              <button 
                onClick={() => handleNavigate('/help')}
                className="hover:text-primary-400 transition-colors"
              >
                نقشه سایت
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}