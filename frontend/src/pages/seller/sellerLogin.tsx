import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function SellerLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // اگر کاربر از قبل لاگین کرده و فروشنده است، مستقیم به داشبورد برو
  if (isAuthenticated && user?.role === 'seller') {
    navigate('/seller', { replace: true });
    return null;
  }

  const handleSellerLogin = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const testSeller = {
        user: {
          id: 888,
          name: 'فروشنده تست',
          email: 'seller@test.com',
          phone: '09123456788',
          role: 'seller' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'mock-token-seller-' + Date.now(),
        seller: {
          id: 1,
          user_id: 888,
          shop_name: 'فروشگاه تکنولند',
          slug: 'tech-land',
          status: 'active',
          health_score: 98,
          rating: 4.9,
          reviews_count: 128,
          products_count: 45,
          orders_count: 230,
          total_revenue: 125000000,
          pending_orders: 8,
          active_products: 42,
          pending_settlements: 15000000,
          total_sales: 230,
          total_products: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      
      await login(testSeller);
      toast.success('به پنل فروشنده خوش آمدید', { icon: '🏪' });
      navigate('/seller');
    } catch (error) {
      toast.error('خطا در ورود فروشنده تست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* لوگو */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl shadow-2xl shadow-primary-500/30 mb-4">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">پنل فروشندگان ازکالا</h1>
          <p className="text-gray-600">برای مدیریت فروشگاه خود وارد شوید</p>
        </div>

        {/* کارت ورود */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/30">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">ورود به پنل فروشنده</h2>
            <p className="text-sm text-gray-600">
              برای دسترسی به داشبورد، محصولات و سفارشات خود وارد شوید
            </p>
          </div>

          {/* ویژگی‌ها */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: '📊', title: 'داشبورد حرفه‌ای' },
              { icon: '📦', title: 'مدیریت محصولات' },
              { icon: '🛒', title: 'پیگیری سفارشات' },
              { icon: '💰', title: 'تسویه حساب آسان' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{item.title}</span>
              </div>
            ))}
          </div>

          {/* دکمه ورود */}
          <Button
            onClick={handleSellerLogin}
            disabled={loading}
            className="w-full"
            size="lg"
            isLoading={loading}
          >
            <Store className="w-5 h-5 ml-2" />
            {loading ? 'در حال ورود...' : 'ورود به عنوان فروشنده تست'}
          </Button>

          {/* اطلاعات */}
          <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border border-primary-100">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">حالت تست</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  این یک حساب تست است. در نسخه نهایی، فروشنده با ایمیل و رمز عبور خود وارد می‌شود.
                </p>
              </div>
            </div>
          </div>

          {/* لینک بازگشت */}
          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به صفحه اصلی
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-success-500" />
            <span>امن و مطمئن</span>
          </div>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-primary-500" />
            <span>پنل حرفه‌ای</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default sellerLogin;
