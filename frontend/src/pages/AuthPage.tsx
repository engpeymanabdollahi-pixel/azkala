import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { authService } from '@/services/api/auth.service';
import {
  Smartphone,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle,
  Store,
  Shield,
  Truck,
  Award,
  Sparkles,
  ArrowLeft,
  Star,
  Users,
  Package,
  Heart,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // محاسبه قدرت رمز عبور
  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
      { label: 'خیلی ضعیف', color: 'bg-error-500', width: '20%' },
      { label: 'ضعیف', color: 'bg-error-400', width: '40%' },
      { label: 'متوسط', color: 'bg-warning-500', width: '60%' },
      { label: 'قوی', color: 'bg-primary-500', width: '80%' },
      { label: 'خیلی قوی', color: 'bg-success-500', width: '100%' },
    ];
    
    return {
      score: Math.min(score, 5),
      ...levels[Math.max(0, score - 1)] || levels[0],
    };
  }, [formData.password]);

  // اعتبارسنجی فرم
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'ایمیل نامعتبر است';
    }
    
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    }
    
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'نام و نام خانوادگی الزامی است';
      }
      if (!formData.phone) {
        newErrors.phone = 'شماره موبایل الزامی است';
      } else if (!/^09[0-9]{9}$/.test(formData.phone)) {
        newErrors.phone = 'شماره موبایل نامعتبر است';
      }
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'رمز عبور با تکرار آن مطابقت ندارد';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // ✅ ورود کاربر تست (Mock - برای تست سریع)
  // ============================================
  const handleTestLogin = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const testUser = {
        user: {
          id: 999,
          name: 'کاربر تست',
          email: 'test@example.com',
          phone: '09123456789',
          role: 'customer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
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

  // ============================================
  // ✅ ورود فروشنده تست (Mock - برای تست سریع)
  // ============================================
  const handleTestSellerLogin = async () => {
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
          shop_name: 'فروشگاه تست',
          slug: 'test-shop',
          status: 'active',
          health_score: 98,
          rating: 4.9,
          reviews_count: 128,
          products_count: 45,
          orders_count: 230,
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

  // ============================================
  // ✅ ورود واقعی با API (تغییر اصلی)
  // ============================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // 🎯 فراخوانی API واقعی
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        // ذخیره در authStore
        await login({
          user: response.data.user,
          token: response.data.token,
        });
        
        toast.success(`خوش آمدید ${response.data.user.name}`, { icon: '👋' });
        
        // هدایت بر اساس نقش کاربر
        if (response.data.user.role === 'seller') {
          navigate('/seller');
        } else {
          navigate('/');
        }
      } else {
        toast.error(response.message || 'خطا در ورود');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // مدیریت خطاهای مختلف API
      if (error.response?.status === 401) {
        toast.error('ایمیل یا رمز عبور اشتباه است');
      } else if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          toast.error(Array.isArray(firstError) ? (firstError as string[])[0] : 'اطلاعات نامعتبر است');
        } else {
          toast.error('اطلاعات وارد شده نامعتبر است');
        }
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید');
      } else {
        toast.error('خطا در ارتباط با سرور');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ ثبت‌نام واقعی با API (تغییر اصلی)
  // ============================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // 🎯 فراخوانی API واقعی
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      if (response.success && response.data) {
        // ذخیره در authStore
        await login({
          user: response.data.user,
          token: response.data.token,
        });
        
        toast.success('حساب کاربری با موفقیت ایجاد شد', { icon: '✅' });
        navigate('/');
      } else {
        toast.error(response.message || 'خطا در ثبت‌نام');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      
      // مدیریت خطاهای مختلف API
      if (error.response?.status === 422) {
        const errors = error.response.data?.errors;
        if (errors) {
          // نمایش اولین خطا
          const firstKey = Object.keys(errors)[0];
          const firstError = errors[firstKey];
          const message = Array.isArray(firstError) ? firstError[0] : firstError;
          
          // ترجمه خطاهای رایج
          if (firstKey === 'email' && message.includes('already')) {
            toast.error('این ایمیل قبلاً ثبت شده است');
          } else if (firstKey === 'phone') {
            toast.error('شماره موبایل نامعتبر است');
          } else {
            toast.error(message);
          }
        } else {
          toast.error('اطلاعات وارد شده نامعتبر است');
        }
      } else if (error.response?.status === 409) {
        toast.error('این ایمیل قبلاً ثبت شده است');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید');
      } else {
        toast.error('خطا در ارتباط با سرور');
      }
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

  const stats = [
    { value: '+۵۰,۰۰۰', label: 'کاربر راضی', icon: Users },
    { value: '+۱۰,۰۰۰', label: 'محصول', icon: Package },
    { value: '۴.۹', label: 'امتیاز کاربران', icon: Star },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ============ بخش چپ - Hero Section ============ */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          <div className="absolute top-20 right-20 w-20 h-20 border-4 border-white/10 rounded-full animate-bounce-slow" />
          <div className="absolute bottom-32 left-32 w-16 h-16 border-4 border-white/10 rounded-lg rotate-45 animate-bounce-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-12 h-12 border-4 border-white/10 rounded-full animate-bounce-slow" style={{ animationDelay: '2s' }} />
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
              <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                با انتخاب مدل گوشی خود، فقط محصولاتی را ببینید که ۱۰۰٪ با دستگاه شما سازگار هستند.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-white/80">{feature.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-white/20">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-black">{stat.value}</p>
                      <p className="text-xs text-white/80">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-white/70">
            <p>© ۱۴۰۳ ازکالا - تمام حقوق محفوظ است</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-white transition-colors">قوانین</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">حریم خصوصی</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============ بخش راست - فرم ============ */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl shadow-xl shadow-primary-500/30 mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              <span className="text-primary-600">از</span>کالا
            </h1>
            <p className="text-gray-500 mt-1 text-sm">مارکت‌پلیس لوازم جانبی موبایل</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
              {isLogin ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری'}
            </h2>
            <p className="text-gray-600">
              {isLogin
                ? 'خوش آمدید! لطفاً اطلاعات خود را وارد کنید'
                : 'در چند ثانیه حساب کاربری خود را بسازید'}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrors({});
                }}
                className={cn(
                  'flex-1 py-3 rounded-lg font-bold text-sm transition-all',
                  isLogin
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                ورود
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrors({});
                }}
                className={cn(
                  'flex-1 py-3 rounded-lg font-bold text-sm transition-all',
                  !isLogin
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                ثبت‌نام
              </button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {!isLogin && (
                <>
                  <Input
                    label="نام و نام خانوادگی"
                    type="text"
                    placeholder="علی رضایی"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    leftIcon={<User className="w-5 h-5" />}
                    error={errors.name}
                    required
                  />
                  <Input
                    label="شماره موبایل"
                    type="tel"
                    placeholder="09123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    leftIcon={<Phone className="w-5 h-5" />}
                    error={errors.phone}
                    required
                  />
                </>
              )}

              <Input
                label="ایمیل"
                type="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email}
                required
              />

              <div>
                <div className="relative">
                  <Input
                    label="رمز عبور"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-[42px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {!isLogin && formData.password && (
                  <div className="mt-3 animate-fade-in">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600 font-medium">قدرت رمز عبور:</span>
                      <span className={cn(
                        'text-xs font-bold',
                        passwordStrength.score <= 2 ? 'text-error-600' :
                        passwordStrength.score === 3 ? 'text-warning-600' :
                        'text-success-600'
                      )}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', passwordStrength.color)}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="relative">
                  <Input
                    label="تکرار رمز عبور"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.password_confirmation}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-[42px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">مرا به خاطر بسپار</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 text-base font-bold"
                size="lg"
                isLoading={loading}
              >
                {loading ? 'در حال پردازش...' : isLogin ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">یا ورود سریع با</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestLogin}
                disabled={loading}
                className="w-full gap-2 border-success-300 hover:border-success-500 hover:bg-success-50 text-success-700"
              >
                <CheckCircle className="w-5 h-5" />
                ورود به عنوان کاربر تست
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSellerLogin}
                disabled={loading}
                className="w-full gap-2 border-accent-300 hover:border-accent-500 hover:bg-accent-50 text-accent-700"
              >
                <Store className="w-5 h-5" />
                ورود به عنوان فروشنده تست
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              {isLogin ? 'حساب کاربری ندارید؟' : 'قبلاً ثبت‌نام کرده‌اید؟'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-primary-600 hover:text-primary-700 font-bold mr-1"
              >
                {isLogin ? 'ثبت‌نام کنید' : 'وارد شوید'}
              </button>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-success-500" />
              <span>پرداخت امن</span>
            </div>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-primary-500" />
              <span>SSL امن</span>
            </div>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-accent-500" />
              <span>نماد اعتماد</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            با ثبت‌نام در ازکالا،{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
              شرایط و قوانین
            </Link>{' '}
            و{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
              حریم خصوصی
            </Link>{' '}
            سایت را می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
}