import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import client from '@/services/api/client';
import {
  Smartphone,
  CheckCircle,
  Store,
  Shield,
  Truck,
  Award,
  Sparkles,
  Star,
  Users,
  Package,
  Heart,
  KeyRound,
  ArrowRight,
  Lock,
  Mail,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [authMethod, setAuthMethod] = useState<'otp' | 'email'>('otp');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^09[0-9]{9}$/.test(phone)) {
      return toast.error('شماره موبایل نامعتبر است');
    }
    
    setLoading(true);
    try {
      const response = await client.post('/verify-otp', { phone });
      if (response.data.success) {
        setDebugOtp(response.data.debug_otp || '');
        toast.success('کد تایید ارسال شد');
        setOtpStep(2);
      } else {
        toast.error(response.data.message || 'خطا در ارسال کد');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 5) {
      return toast.error('کد تایید ۵ رقمی را وارد کنید');
    }

    setLoading(true);
    try {
      const response = await client.post('/verify-otp', { phone, otp });
      
      if (response.data.success && response.data.data) {
        await login({
          user: response.data.data.user,
          token: response.data.data.token,
        });
        toast.success('خوش آمدید!');
        navigate('/dashboard/profile');
      } else {
        toast.error(response.data.message || 'کد وارد شده اشتباه است');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'کد وارد شده اشتباه یا منقضی است');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('ایمیل و رمز عبور را وارد کنید');
    }

    setLoading(true);
    try {
      const response = await client.post('/login', { email, password });
      
      if (response.data.success && response.data.data) {
        await login({
          user: response.data.data.user,
          token: response.data.data.token,
        });
        toast.success('خوش آمدید!');
        navigate('/dashboard/profile');
      } else {
        toast.error(response.data.message || 'ایمیل یا رمز عبور اشتباه است');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'خطا در ورود';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const testUser = {
        user: { id: 999, name: 'کاربر تست', email: 'test@example.com', phone: '09123456789', role: 'customer', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        token: 'mock-token-' + Date.now(),
      };
      await login(testUser);
      toast.success('با موفقیت وارد شدید', { icon: '🎉' });
      navigate('/');
    } catch (error) {
      toast.error('خطا در ورود تست');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSellerLogin = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const testSeller = {
        user: { id: 888, name: 'فروشنده تست', email: 'seller@test.com', phone: '09123456788', role: 'seller', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        token: 'mock-token-seller-' + Date.now(),
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

  const features = [
    { icon: Shield, title: 'ضمانت اصالت', desc: '۱۰۰٪ اصل و با گارانتی' },
    { icon: Truck, title: 'ارسال سریع', desc: 'تحویل ۲۴ تا ۷۲ ساعته' },
    { icon: Award, title: 'بهترین قیمت', desc: 'تضمین بهترین قیمت بازار' },
    { icon: Heart, title: 'پشتیبانی ۲۴/۷', desc: 'همیشه در کنار شما' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">
                <span className="text-white">از</span>
                <span className="text-accent-300">کالا</span>
              </h1>
              <p className="text-sm text-white/80">مارکت‌پلیس لوازم جانبی</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <Badge className="mb-4 bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
                <Sparkles className="w-4 h-4 ml-1" />
                به ازکالا خوش آمدید
              </Badge>
              <h2 className="text-5xl font-black leading-tight mb-4">
                خرید هوشمندانه
                <br />
                <span className="text-accent-300">لوازم جانبی موبایل</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-white/80">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
              {authMethod === 'otp' 
                ? (otpStep === 1 ? 'ورود / ثبت‌نام' : 'تایید شماره موبایل')
                : 'ورود به حساب کاربری'}
            </h2>
            <p className="text-gray-600">
              {authMethod === 'otp'
                ? (otpStep === 1 ? 'شماره موبایل خود را وارد کنید' : `کد ارسال شده به ${phone}`)
                : 'ایمیل و رمز عبور خود را وارد کنید'}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMethod('otp'); setOtpStep(1); }}
                className={cn(
                  'flex-1 py-3 rounded-lg font-bold text-sm transition-all',
                  authMethod === 'otp'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Smartphone className="w-4 h-4 inline ml-1" />
                شماره موبایل
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={cn(
                  'flex-1 py-3 rounded-lg font-bold text-sm transition-all',
                  authMethod === 'email'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Mail className="w-4 h-4 inline ml-1" />
                ایمیل و رمز
              </button>
            </div>

            {authMethod === 'otp' && otpStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">شماره موبایل</label>
                  <input
                    type="tel"
                    placeholder="09123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-left font-mono"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading || phone.length !== 11} className="w-full py-3.5" size="lg" isLoading={loading}>
                  دریافت کد تایید
                </Button>
              </form>
            )}

            {authMethod === 'otp' && otpStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">کد تایید</label>
                  <input
                    type="text"
                    placeholder="-----"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-[0.5em] font-mono font-bold"
                    required
                    autoFocus
                  />
                  {debugOtp && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs p-3 rounded-lg text-center">
                      <span className="font-bold">کد تست:</span> {debugOtp}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={loading || otp.length !== 5} className="w-full py-3.5" size="lg" isLoading={loading}>
                  تایید و ورود
                </Button>
                <button type="button" onClick={() => { setOtpStep(1); setOtp(''); }} className="w-full text-sm text-gray-500 hover:text-primary-600">
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {authMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ایمیل</label>
                  <input
                    type="email"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رمز عبور</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full py-3.5" size="lg" isLoading={loading}>
                  ورود به حساب
                </Button>
              </form>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">ورود سریع توسعه‌دهنده</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button type="button" variant="outline" onClick={handleTestLogin} disabled={loading} className="w-full gap-2">
                <CheckCircle className="w-5 h-5" />
                ورود کاربر تست
              </Button>
              <Button type="button" variant="outline" onClick={handleTestSellerLogin} disabled={loading} className="w-full gap-2">
                <Store className="w-5 h-5" />
                ورود فروشنده تست
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-8">
              آیا فروشنده هستید؟{' '}
              <button type="button" onClick={() => navigate('/seller-request')} className="text-primary-600 hover:text-primary-700 font-bold">
                درخواست فروشندگی
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AuthPage;
