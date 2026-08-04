import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Pencil, RefreshCw, ShieldCheck, ShoppingBag, Smartphone, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import apiClient, { fetchCsrfCookie } from '@/services/api/client';
import { cn } from '@/utils/cn';
import { OtpInput } from './OtpInput';

const OTP_LENGTH = 5;
const RESEND_SECONDS = 120;

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'شماره موبایل را وارد کنید')
    .regex(/^09\d{9}$/, 'شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد'),
});

type PhoneData = z.infer<typeof phoneSchema>;

interface AuthApiResponse {
  phone?: string;
  token?: string;
  user?: unknown;
  data?: { phone?: string; token?: string; user?: unknown };
  message?: string;
}

/**
 * مودال ورود و ثبت‌نام.
 *
 * ورود با کد یک‌بارمصرف است، پس ورود و ثبت‌نام یک مسیر واحدند — کاربر لازم
 * نیست از قبل بداند حساب دارد یا نه، و رمزی هم برای فراموش کردن وجود ندارد.
 *
 * از هر جای اپ با useAuthModalStore().open() باز می‌شود و پس از ورود موفق،
 * کاری که کاربر می‌خواست انجام دهد ادامه پیدا می‌کند.
 */
export function AuthModal() {
  const { isOpen, reason, close, resolve } = useAuthModalStore();
  const { login } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const dialogRef = useRef<HTMLDivElement>(null);

  const phoneForm = useForm<PhoneData>({
    resolver: zodResolver(phoneSchema),
    mode: 'onBlur',
  });

  const resetAll = useCallback(() => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setSecondsLeft(RESEND_SECONDS);
    phoneForm.reset();
  }, [phoneForm]);

  // ── ارسال کد ──────────────────────────────────────────────────────────────
  const sendOtp = useMutation({
    mutationFn: async (data: PhoneData) => {
      // احراز هویت stateful توکن CSRF می‌خواهد؛ بدون این، درخواست ۴۱۹ می‌گیرد.
      // نسخه‌ی قبلی fetch خام می‌زد و اصلاً از این مسیر رد نمی‌شد.
      await fetchCsrfCookie();

      const response = await apiClient.post<AuthApiResponse>('/register', { phone: data.phone });

      return response.data;
    },
    onSuccess: (data, variables) => {
      setPhoneNumber(data.phone ?? data.data?.phone ?? variables.phone);
      setStep('otp');
      setOtp('');
      setSecondsLeft(RESEND_SECONDS);
      toast.success('کد تأیید برایتان ارسال شد', { icon: '✉️' });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'ارسال کد ممکن نشد. لطفاً دوباره تلاش کنید';
      toast.error(message);
    },
  });

  // ── تأیید کد ──────────────────────────────────────────────────────────────
  const verifyOtp = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.post<AuthApiResponse>('/verify-otp', {
        phone: phoneNumber,
        otp: code,
      });

      return response.data;
    },
    onSuccess: async (data) => {
      const user = data.user ?? data.data?.user;
      const token = data.token ?? data.data?.token;

      if (user) {
        await login({ user, token } as never);
      }

      toast.success('خوش آمدید', { icon: '🎉' });

      // مودال بسته می‌شود و کاری که کاربر شروع کرده بود ادامه پیدا می‌کند.
      resolve();
      setTimeout(resetAll, 300);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'کد وارد‌شده درست نیست یا منقضی شده';
      toast.error(message);
      setOtp('');
    },
  });

  // ── شمارش معکوس ارسال مجدد ────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => setSecondsLeft((current) => current - 1), 1000);

    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  // ── بستن با Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  // ── قفل اسکرول پس‌زمینه ───────────────────────────────────────────────────
  // بدون این، صفحه‌ی زیر مودال با اسکرول می‌لغزد و کاربر موقعیتش را گم می‌کند.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // ── نگه داشتن فوکوس داخل مودال ────────────────────────────────────────────
  // بدون تله‌ی فوکوس، Tab کاربر را به صفحه‌ی پشت مودال می‌برد در حالی که آنجا
  // برایش قابل دیدن نیست.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const node = dialogRef.current;
    if (!node) {
      return;
    }

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(selector));
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);

    return () => node.removeEventListener('keydown', onKeyDown);
  }, [isOpen, step]);

  if (!isOpen) {
    return null;
  }

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const handleClose = () => {
    close();
    setTimeout(resetAll, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        aria-label="بستن"
        onClick={handleClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={cn(
          'relative w-full sm:max-w-md bg-white dark:bg-gray-900',
          // روی موبایل از پایین بالا می‌آید و گوشه‌های پایینش صاف است — الگویی
          // که کاربر موبایل با آن آشناست و به شست نزدیک‌تر می‌ماند.
          'rounded-t-3xl sm:rounded-3xl',
          'shadow-2xl shadow-gray-900/20 dark:shadow-black/50',
          'border border-gray-100 dark:border-gray-800',
          'overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300'
        )}
      >
        {/* دستگیره‌ی کشیدن روی موبایل */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="بستن پنجره"
          className={cn(
            'absolute top-4 left-4 z-10 p-2 rounded-full',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'transition-colors active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* سرآمد با ته‌رنگ برند — همان فلسفه‌ی Card: رنگ ملایم، نه بنر پررنگ
            که با محتوای فرم رقابت کند. */}
        <div
          className={cn(
            'relative px-6 pt-8 pb-6 sm:pt-9',
            'bg-gradient-to-br from-primary-50/80 via-white to-white',
            'dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-900',
            'border-b border-gray-100 dark:border-gray-800'
          )}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
                'bg-primary-600 text-white',
                'shadow-lg shadow-primary-600/25'
              )}
            >
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="leading-tight">
              <p className="font-black text-lg text-gray-900 dark:text-gray-50">ازکالا</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                خرید لوازم جانبی بر اساس مدل دستگاه
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                'bg-white dark:bg-gray-800',
                'border border-primary-100 dark:border-primary-900/50',
                'text-primary-600 dark:text-primary-400'
              )}
            >
              {step === 'phone' ? <Smartphone className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>

            <div>
              <h2
                id="auth-modal-title"
                className="text-xl font-black text-gray-900 dark:text-gray-50 mb-1 leading-tight"
              >
                {step === 'phone' ? 'ورود یا ثبت‌نام' : 'کد تأیید'}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {step === 'phone' ? (
                  // دلیلِ زمینه‌ای، اگر ورود وسط کاری لازم شده باشد. پیام مرتبط
                  // با همان کار خیلی بهتر از یک «لطفاً وارد شوید» خشک عمل می‌کند.
                  reason ?? 'شماره موبایلتان را وارد کنید تا کد ورود بفرستیم.'
                ) : (
                  <>
                    کد ۵ رقمی به{' '}
                    <span className="font-bold text-gray-700 dark:text-gray-200" dir="ltr">
                      {phoneNumber}
                    </span>{' '}
                    پیامک شد.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          {step === 'phone' ? (
            <form
              onSubmit={phoneForm.handleSubmit((data) => sendOtp.mutate(data))}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="auth-phone"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
                >
                  شماره موبایل
                </label>

                <div className="relative">
                  <input
                    {...phoneForm.register('phone')}
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="09123456789"
                    maxLength={11}
                    disabled={sendOtp.isPending}
                    aria-invalid={!!phoneForm.formState.errors.phone}
                    aria-describedby={phoneForm.formState.errors.phone ? 'auth-phone-error' : undefined}
                    dir="ltr"
                    className={cn(
                      'w-full h-14 pl-4 pr-12 rounded-2xl text-left text-lg font-semibold tracking-wide',
                      'bg-gray-50 dark:bg-gray-800',
                      'text-gray-900 dark:text-gray-100',
                      'placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:font-normal',
                      'border-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                      'disabled:opacity-60',
                      phoneForm.formState.errors.phone
                        ? 'border-error-400 dark:border-error-600 focus:ring-error-500'
                        : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-500'
                    )}
                  />
                  <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {phoneForm.formState.errors.phone && (
                  <p
                    id="auth-phone-error"
                    role="alert"
                    className="text-error-600 dark:text-error-400 text-xs mt-2 font-medium"
                  >
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sendOtp.isPending}
                className={cn(
                  'w-full h-14 rounded-2xl font-bold text-white',
                  'bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500',
                  'shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30',
                  'transition-all duration-300 active:scale-[0.98]',
                  'disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                  'flex items-center justify-center gap-2'
                )}
              >
                {sendOtp.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال ارسال…
                  </>
                ) : (
                  <>
                    ارسال کد ورود
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  اگر قبلاً حساب نداشته باشید، همین‌جا ساخته می‌شود. رمز عبوری در کار نیست.
                </span>
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              {/* راهنمای صریح: بدون آن، پنج کادر خالی معلوم نمی‌کند چه انتظاری
                  از کاربر می‌رود و از کجا باید شروع کند. */}
              <p className="text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                کد را در کادرهای زیر وارد کنید
              </p>

              <OtpInput
                length={OTP_LENGTH}
                value={otp}
                onChange={setOtp}
                // با کامل شدن رقم آخر خودکار ارسال می‌شود؛ زدن دکمه پس از تایپ
                // رقم پنجم یک گام اضافه است که هیچ کاری نمی‌کند.
                onComplete={(code) => verifyOtp.mutate(code)}
                disabled={verifyOtp.isPending}
                hasError={verifyOtp.isError}
              />

              <button
                type="button"
                onClick={() => verifyOtp.mutate(otp)}
                disabled={verifyOtp.isPending || otp.length !== OTP_LENGTH}
                className={cn(
                  'w-full h-14 rounded-2xl font-bold text-white',
                  'bg-success-600 hover:bg-success-700 dark:bg-success-600 dark:hover:bg-success-500',
                  'shadow-lg shadow-success-600/25 hover:shadow-xl hover:shadow-success-600/30',
                  'transition-all duration-300 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500',
                  'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                  'flex items-center justify-center gap-2'
                )}
              >
                {verifyOtp.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال بررسی…
                  </>
                ) : (
                  <>
                    ورود
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-3">
                {secondsLeft > 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    ارسال دوباره تا{' '}
                    <span className="font-bold text-gray-600 dark:text-gray-300 tabular-nums" dir="ltr">
                      {formatTime(secondsLeft)}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendOtp.mutate({ phone: phoneNumber })}
                    disabled={sendOtp.isPending}
                    className={cn(
                      'text-sm font-bold text-primary-600 dark:text-primary-400',
                      'hover:text-primary-700 dark:hover:text-primary-300',
                      'flex items-center gap-1.5 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg px-2 py-1',
                      'disabled:opacity-60'
                    )}
                  >
                    <RefreshCw className={cn('w-4 h-4', sendOtp.isPending && 'animate-spin')} />
                    {sendOtp.isPending ? 'در حال ارسال…' : 'ارسال دوباره‌ی کد'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  disabled={verifyOtp.isPending}
                  className={cn(
                    'text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    'flex items-center gap-1.5 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg px-2 py-1'
                  )}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  ویرایش شماره
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
