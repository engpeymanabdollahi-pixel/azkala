// src/pages/AboutPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Shield, Truck, Headphones, Award, Users, Target, Zap, Package } from 'lucide-react';
import Seo from '@/components/Seo';
import apiClient from '@/services/api/client';

interface PlatformStats {
  products_count: number;
  sellers_count: number;
}

const fetchPlatformStats = async (): Promise<PlatformStats> => {
  const response = await apiClient.get('/platform-stats');
  return response.data?.data || { products_count: 0, sellers_count: 0 };
};

export function AboutPage() {
  const features = [
    { icon: Shield, title: 'ضمانت اصالت', desc: 'همه محصولات با گارانتی اصالت و کیفیت' },
    { icon: Truck, title: 'ارسال سریع', desc: 'ارسال به سراسر کشور در کمترین زمان' },
    { icon: Headphones, title: 'پشتیبانی ۲۴/۷', desc: 'پاسخگویی شبانه‌روزی به سوالات شما' },
    { icon: Award, title: 'بهترین قیمت', desc: 'تضمین بهترین قیمت با امکان مقایسه' },
  ];

  // ✅ قبلاً این آمار ۴ عدد کاملاً ثابت و ساختگی بود («+۱۰,۰۰۰ محصول»،
  // «+۵۰۰ فروشنده»، «۹۸٪ رضایت»، «+۵۰,۰۰۰ مشتری») که به هیچ داده‌ی واقعی
  // وصل نبود — دقیقاً همان نوع ادعای بی‌منبعی که در این ممیزی ممنوع است.
  // «رضایت ۹۸٪» و «مشتری» بدون یک تعریف دقیق و قابل‌اندازه‌گیری، صادقانه
  // قابل‌محاسبه نیستند و عمداً حذف شدند. تعداد محصول و فروشنده اما واقعاً
  // قابل‌شمارش‌اند — از GET /platform-stats (شمارش واقعی روی دیتابیس)
  // خوانده می‌شوند، نه یک رقم بازاریابیِ گرد‌شده.
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 1000 * 60 * 10,
  });

  const statCards = [
    { value: statsLoading ? '…' : `+${stats?.products_count ?? 0}`, label: 'محصول فعال', icon: Package },
    { value: statsLoading ? '…' : `+${stats?.sellers_count ?? 0}`, label: 'فروشنده فعال', icon: Users },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Seo
        title="درباره ازکالا"
        description="ازکالا مارکت‌پلیس تخصصی لوازم جانبی موبایل و تبلت در ایران با قانون هوشمند سازگاری — فقط محصولاتی که با دستگاه شما سازگارند."
        canonical="/about"
        keywords={['ازکالا', 'لوازم جانبی موبایل', 'مارکت‌پلیس', 'خرید قاب گوشی', 'گارانتی اصالت', 'فروشگاه آنلاین']}
      />

      {/* هدر */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">درباره ازکالا</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">مارکت‌پلیس تخصصی لوازم جانبی موبایل با قانون هوشمند سازگاری</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* داستان ما */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">داستان ازکالا</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            ازکالا با هدف ساده‌سازی خرید لوازم جانبی موبایل و حذف خطاهای سازگاری شکل گرفت.
            بسیاری از کاربران هنگام خرید لوازم جانبی، محصولی می‌خرند که با گوشی آن‌ها سازگار نیست.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            به همین دلیل «قانون هوشمند ازکالا» را طراحی کردیم: با انتخاب مدل گوشی، تنها محصولاتی نمایش داده می‌شوند
            که ۱۰۰٪ با دستگاه شما سازگار هستند.
          </p>
        </div>

        {/* ماموریت و چشم‌انداز */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">ماموریت ما</h3>
            <p className="text-gray-600 dark:text-gray-400">ارائه بهترین تجربه خرید آنلاین با ضمانت اصالت، قیمت منصفانه و ارسال سریع</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">چشم‌انداز</h3>
            <p className="text-gray-600 dark:text-gray-400">تبدیل شدن به مرجع اصلی خرید لوازم جانبی موبایل در ایران</p>
          </div>
        </div>

        {/* آمار واقعی */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-8">
          <div className="grid grid-cols-2 gap-6 text-center max-w-md mx-auto">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i}>
                  <Icon className="w-10 h-10 mx-auto mb-2 text-blue-200" />
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-blue-100 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ویژگی‌ها */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">چرا ازکالا؟</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default AboutPage;
