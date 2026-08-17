import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import client from '@/services/api/client';
import { devService } from '@/services/api/dev.service';
import {
  Smartphone,
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { OtpInput } from '@/components/auth/OtpInput';

/* =====================================================================
 *  Neumorphic Design Tokens
 *  بر اساس دیزاین رفرنس OTP با کارت مرکزی، آیکن دایره‌ای، اینپوت‌های inset
 *  بک‌گراند: Light #e8ebf2 | Dark #262b35
 *  سایه: raised (بیرون) و inset (داخل) در هر دو تم
 * ===================================================================== */

const NEU = {
  // سایه بیرون کارت (raised)
  cardLight: 'shadow-[12px_12px_24px_rgba(163,177,198,0.55),-12px_-12px_24px_rgba(255,255,255,0.9)]',
  cardDark: 'dark:shadow-[12px_12px_24px_rgba(0,0,0,0.55),-12px_-12px_24px_rgba(255,255,255,0.06)]',

  // سایه داخل اینپوت (inset)
  inputLight: 'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.5),inset_-5px_-5px_10px_rgba(255,255,255,0.85)]',
  inputDark: 'dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.5),inset_-5px_-5px_10px_rgba(255,255,255,0.05)]',

  // سایه دکمه (raised)
  btnLight: 'shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.9)]',
  btnDark: 'dark:shadow-[8px_8px_16px_rgba(0,0,0,0.6),-8px_-8px_16px_rgba(255,255,255,0.05)]',

  // سایه دکمه فشرده (inset)
  btnActiveLight: 'active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.85)]',
  btnActiveDark: 'dark:active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.05)]',

  // سایه آیکن دایره‌ای (raised)
  iconLight: 'shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.85)]',
  iconDark: 'dark:shadow-[9px_9px_16px_rgba(0,0,0,0.6),-9px_-9px_16px_rgba(255,255,255,0.05)]',
};

// =====================================================================
// AuthPage - Neumorphic Redesign
// حفظ کامل منطق قبلی (OTP + Email/Password + Dev Tools)
// =====================================================================

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

  // Countdown برای resend OTP
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /* ------------------------------ Handlers ------------------------------ */

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^09[0-9]{9}$/.test(phone)) {
      return toast.error('شماره موبایل نامعتبر است');
    }

    setLoading(true);
    try {
      const response = await client.post('/register', { phone });
      if (response.data.success) {
        setDebugOtp(response.data.debug_otp || '');
        toast.success('کد تایید ارسال شد');
        setOtpStep(2);
        setOtp('');
        setCooldown(60);
      } else {
        toast.error(response.data.message || 'خطا در ارسال کد');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDevOtp = async () => {
    if (!phone || phone.length !== 11) {
      toast.error('ابتدا شماره موبایل را وارد کنید');
      return;
    }
    try {
      setLoading(true);
      const { otp: devOtp } = await devService.getOtp(phone);
      setOtp(devOtp);
      toast.success(`کد OTP: ${devOtp} (محیط توسعه)`);
    } catch (error: any) {
      toast.error(error.message || 'ابتدا کد را درخواست کنید');
    } finally {
      setLoading(false);
    }
  };

  const handleDevAdminLogin = async () => {
    try {
      setLoading(true);
      const { user, token } = await devService.adminLogin();
      await login({ user, token });
      toast.success('ورود ادمین (dev mode)');
    } catch (error: any) {
      toast.error('فقط در محیط local فعال است');
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
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'کد وارد شده اشتباه یا منقضی است');
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
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMsg = axiosError.response?.data?.message || 'خطا در ورود';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Render ------------------------------ */

  const formatCooldown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div
      dir="rtl"
      className={cn(
        'min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors',
        'bg-[#e8ebf2] dark:bg-[#262b35]'
      )}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* ================= آیکن دایره‌ای بالای کارت ================= */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full',
              'bg-[#e8ebf2] dark:bg-[#262b35]',
              NEU.iconLight,
              NEU.iconDark,
              'transition-all duration-300'
            )}
          >
            <ShieldCheck className="w-10 h-10 text-primary-600 dark:text-primary-400" strokeWidth={2.2} />
          </div>
        </div>

        {/* ================= عنوان ================= */}
        <h1 className="text-center text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
          {authMethod === 'otp'
            ? otpStep === 1
              ? 'ورود به ازکالا'
              : 'تایید کد'
            : 'ورود با رمز'}
        </h1>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {authMethod === 'otp'
            ? otpStep === 1
              ? 'برای ادامه، شماره موبایل خود را وارد کنید'
              : (
                <>
                  کد ۵ رقمی ارسال شده به
                  <br />
                  <span className="font-bold text-slate-700 dark:text-slate-200 tracking-wider dir-ltr">{phone}</span>
                  را وارد کنید
                </>
              )
            : 'ایمیل و رمز عبور حساب خود را وارد کنید'}
        </p>

        {/* ================= کارت اصلی neumorphic ================= */}
        <div
          className={cn(
            'rounded-[2rem] p-6 sm:p-8',
            'bg-[#e8ebf2] dark:bg-[#262b35]',
            NEU.cardLight,
            NEU.cardDark,
            'transition-all duration-300'
          )}
        >
          {/* ---------------- تب‌سوییچر ---------------- */}
          <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-[#e8ebf2] dark:bg-[#262b35] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.04)]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setOtpStep(1);
                setOtp('');
              }}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300',
                'flex items-center justify-center gap-1.5',
                authMethod === 'otp'
                  ? cn(
                      'bg-[#e8ebf2] dark:bg-[#262b35] text-primary-600 dark:text-primary-400',
                      NEU.btnLight,
                      NEU.btnDark
                    )
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Smartphone className="w-4 h-4" />
              کد تایید
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300',
                'flex items-center justify-center gap-1.5',
                authMethod === 'email'
                  ? cn(
                      'bg-[#e8ebf2] dark:bg-[#262b35] text-primary-600 dark:text-primary-400',
                      NEU.btnLight,
                      NEU.btnDark
                    )
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Mail className="w-4 h-4" />
              ایمیل و رمز
            </button>
          </div>

          {/* ============== Tab 1: OTP Step 1 - شماره موبایل ============== */}
          {authMethod === 'otp' && otpStep === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 pr-1">
                  شماره موبایل
                </label>
                <div className="relative">
                  <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="09123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    className={cn(
                      'w-full pr-12 pl-4 py-4 rounded-2xl',
                      'bg-[#e8ebf2] dark:bg-[#262b35]',
                      'text-slate-800 dark:text-slate-100 text-center font-mono text-lg font-bold tracking-wider',
                      'outline-none transition-all duration-200',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:text-base placeholder:tracking-normal',
                      NEU.inputLight,
                      NEU.inputDark,
                      'focus:ring-2 focus:ring-primary-400/50 dark:focus:ring-primary-500/50'
                    )}
                    dir="ltr"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 11}
                className={cn(
                  'w-full py-4 rounded-2xl font-bold text-base',
                  'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
                  NEU.btnLight,
                  NEU.btnDark,
                  NEU.btnActiveLight,
                  NEU.btnActiveDark,
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200'
                )}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    دریافت کد تایید
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============== Tab 1: OTP Step 2 - کد تایید ============== */}
          {authMethod === 'otp' && otpStep === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* نمایش debug OTP در dev mode */}
              {debugOtp && import.meta.env.DEV && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <Sparkles className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-xs text-primary-700 dark:text-primary-300">
                    کد تست: <span className="font-mono font-bold tracking-widest dir-ltr">{debugOtp}</span>
                  </span>
                </div>
              )}

              <div className="py-2">
                <OtpInput
                  length={5}
                  value={otp}
                  onChange={setOtp}
                  onComplete={(code) => {
                    // بعد از کامل شدن، خودکار submit می‌شود
                    setTimeout(() => {
                      const form = document.getElementById('otp-form') as HTMLFormElement;
                      form?.requestSubmit();
                    }, 200);
                  }}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                id="otp-form"
                disabled={loading || otp.length !== 5}
                className={cn(
                  'w-full py-4 rounded-2xl font-bold text-base',
                  'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
                  NEU.btnLight,
                  NEU.btnDark,
                  NEU.btnActiveLight,
                  NEU.btnActiveDark,
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200'
                )}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    در حال تایید...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    تایید و ورود
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(1);
                    setOtp('');
                  }}
                  className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                >
                  تغییر شماره
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={cooldown > 0}
                  className={cn(
                    'transition-colors',
                    cooldown > 0
                      ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-bold'
                  )}
                >
                  {cooldown > 0
                    ? `ارسال مجدد (${formatCooldown(cooldown)})`
                    : 'ارسال مجدد کد'}
                </button>
              </div>
            </form>
          )}

          {/* ============== Tab 2: ایمیل و رمز ============== */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              {/* ایمیل */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 pr-1">
                  ایمیل
                </label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      'w-full pr-12 pl-4 py-4 rounded-2xl',
                      'bg-[#e8ebf2] dark:bg-[#262b35]',
                      'text-slate-800 dark:text-slate-100',
                      'outline-none transition-all duration-200',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                      NEU.inputLight,
                      NEU.inputDark,
                      'focus:ring-2 focus:ring-primary-400/50 dark:focus:ring-primary-500/50'
                    )}
                    dir="ltr"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* رمز عبور */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 pr-1">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      'w-full pr-12 pl-4 py-4 rounded-2xl',
                      'bg-[#e8ebf2] dark:bg-[#262b35]',
                      'text-slate-800 dark:text-slate-100',
                      'outline-none transition-all duration-200',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                      NEU.inputLight,
                      NEU.inputDark,
                      'focus:ring-2 focus:ring-primary-400/50 dark:focus:ring-primary-500/50'
                    )}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className={cn(
                  'w-full py-4 rounded-2xl font-bold text-base',
                  'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
                  NEU.btnLight,
                  NEU.btnDark,
                  NEU.btnActiveLight,
                  NEU.btnActiveDark,
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200'
                )}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  <>
                    ورود به حساب
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============== Dev Tools (فقط در محیط توسعه) ============== */}
          {import.meta.env.DEV && (
            <div
              className={cn(
                'mt-5 p-3 rounded-2xl',
                'bg-[#e8ebf2] dark:bg-[#262b35]',
                NEU.inputLight,
                NEU.inputDark
              )}
            >
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2 pr-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                ابزار توسعه (فقط dev)
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGetDevOtp}
                  className="flex-1 min-w-[130px] py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  📩 دریافت OTP خودکار
                </button>
                <button
                  type="button"
                  onClick={handleDevAdminLogin}
                  className="flex-1 min-w-[130px] py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  👑 Login ادمین سریع
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============== Footer ============== */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            فروشنده هستید؟{' '}
            <button
              type="button"
              onClick={() => navigate('/seller-request')}
              className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              درخواست فروشندگی
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;