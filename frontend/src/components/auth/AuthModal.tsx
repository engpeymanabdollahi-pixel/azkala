import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  Smartphone,
  X,
  Gift,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import apiClient, { fetchCsrfCookie } from '@/services/api/client';
import { cn } from '@/utils/cn';
import { digitsOnly, toLatinDigits } from '@/utils/digits';
import { getStoredReferralCode, clearStoredReferralCode } from '@/lib/referralCapture';
import { OtpInput } from './OtpInput';

const OTP_LENGTH = 5;
const RESEND_SECONDS = 120;

// =====================================================================
// Neumorphic Tokens — فقط برای عناصر داخلی (دکمه/اینپوت/آیکن)
// سایه پنل مدال حذف شد (flat)
// =====================================================================
const NEU = {
  inputLight: 'shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]',
  inputDark: 'dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.18),inset_-3px_-3px_6px_rgba(255,255,255,0.02)]',

  btnLight: 'shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.7)]',
  btnDark: 'dark:shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.03)]',
  btnActiveLight: 'active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]',
  btnActiveDark: 'dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.18),inset_-3px_-3px_6px_rgba(255,255,255,0.02)]',

  iconLight: 'shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.7)]',
  iconDark: 'dark:shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.03)]',
};

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'شماره موبایل را وارد کنید')
    .transform(toLatinDigits)
    .refine((value) => /^09\d{9}$/.test(value), 'شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد'),
});

type PhoneData = z.infer<typeof phoneSchema>;

interface AuthApiResponse {
  phone?: string;
  token?: string;
  user?: unknown;
  data?: { phone?: string; token?: string; user?: unknown };
  message?: string;
}

export function AuthModal() {
  const { isOpen, reason, close, resolve } = useAuthModalStore();
  const { login } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const initialReferralCode = getStoredReferralCode() ?? '';
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [showReferralField, setShowReferralField] = useState(!!initialReferralCode);

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
    const storedCode = getStoredReferralCode() ?? '';
    setReferralCode(storedCode);
    setShowReferralField(!!storedCode);
  }, [phoneForm]);

  const sendOtp = useMutation({
    mutationFn: async (data: PhoneData) => {
      await fetchCsrfCookie();
      const trimmedReferralCode = referralCode.trim();
      const response = await apiClient.post<AuthApiResponse>('/register', {
        phone: data.phone,
        ...(trimmedReferralCode ? { ref: trimmedReferralCode } : {}),
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      setPhoneNumber(data.phone ?? data.data?.phone ?? variables.phone);
      setStep('otp');
      setOtp('');
      setSecondsLeft(RESEND_SECONDS);
      toast.success('کد تأیید برایتان ارسال شد', { icon: '✉️' });
      clearStoredReferralCode();
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'ارسال کد ممکن نشد. لطفاً دوباره تلاش کنید';
      toast.error(message);
    },
  });

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

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const node = dialogRef.current;
    if (!node) return;

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(selector));
      if (focusable.length === 0) return;

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

  const handleClose = () => {
    close();
    setTimeout(resetAll, 300);
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="بستن"
        onClick={handleClose}
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 focus:outline-none"
      />

      {/* Modal Panel — بدون سایه، با border ظریف برای خوانایی */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full sm:max-w-md',
          'bg-[#e8ebf2] dark:bg-[#262b35]',
          'rounded-t-[2rem] sm:rounded-[2rem]',
          'border border-slate-200/60 dark:border-slate-700/60',
          'overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 ease-out'
        )}
      >
        {/* دستگیره موبایل */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-slate-400/30 dark:bg-slate-500/30" aria-hidden="true" />
        </div>

        {/* دکمه بستن */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="بستن پنجره"
          className={cn(
            'absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center',
            'bg-[#e8ebf2] dark:bg-[#262b35]',
            NEU.iconLight,
            NEU.iconDark,
            'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            'transition-all duration-200 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative px-6 pt-8 pb-6">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                'bg-[#e8ebf2] dark:bg-[#262b35]',
                NEU.iconLight,
                NEU.iconDark
              )}
            >
              {step === 'phone' ? (
                <Smartphone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              ) : (
                <KeyRound className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              )}
            </div>

            <div className="flex-1">
              <h2
                id="auth-modal-title"
                className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1.5 leading-tight"
              >
                {step === 'phone' ? 'ورود یا ثبت‌نام' : 'کد تأیید'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {step === 'phone'
                  ? (reason ?? 'شماره موبایلتان را وارد کنید تا کد ورود بفرستیم.')
                  : 'کد تایید را وارد نمایید'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 sm:pb-8 pt-2">
          {step === 'phone' ? (
            <form
              onSubmit={phoneForm.handleSubmit((data) => sendOtp.mutate(data))}
              className="space-y-5"
              noValidate
            >
              {/* Phone Input - LTR */}
              <div className="space-y-2">
                <label
                  htmlFor="auth-phone"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-300 pr-1"
                >
                  شماره موبایل
                </label>

                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors duration-200 group-focus-within:text-primary-500" />
                  <input
                    {...phoneForm.register('phone')}
                    onInput={(event) => {
                      const input = event.currentTarget;
                      const normalised = digitsOnly(input.value).slice(0, 11);
                      if (normalised !== input.value) {
                        input.value = normalised;
                      }
                    }}
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
                      'w-full pl-12 pr-4 py-4 rounded-2xl',
                      'bg-[#e8ebf2] dark:bg-[#262b35]',
                      'text-slate-800 dark:text-slate-100 text-left font-mono text-lg font-bold tracking-wider',
                      'outline-none transition-all duration-200',
                      'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:text-base placeholder:tracking-normal',
                      NEU.inputLight,
                      NEU.inputDark,
                      'focus:ring-2 focus:ring-primary-400/50 dark:focus:ring-primary-500/50',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      phoneForm.formState.errors.phone && 'ring-2 ring-red-400/50'
                    )}
                  />
                </div>

                {phoneForm.formState.errors.phone && (
                  <p
                    id="auth-phone-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400 pr-1 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <span className="w-3.5 h-3.5 shrink-0">⚠️</span>
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Referral */}
              <div>
                {!showReferralField ? (
                  <button
                    type="button"
                    onClick={() => setShowReferralField(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors pr-1"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    کد معرف دارید؟
                  </button>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="auth-referral-code"
                        className="block text-xs font-bold text-slate-600 dark:text-slate-300 pr-1"
                      >
                        کد معرف (اختیاری)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReferralField(false);
                          setReferralCode('');
                        }}
                        className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        بستن
                      </button>
                    </div>
                    <div className="relative group">
                      <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors duration-200 group-focus-within:text-primary-500" />
                      <input
                        id="auth-referral-code"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="مثلاً 7K9M2XQP"
                        maxLength={8}
                        disabled={sendOtp.isPending}
                        dir="ltr"
                        className={cn(
                          'w-full pl-12 pr-4 py-4 rounded-2xl',
                          'bg-[#e8ebf2] dark:bg-[#262b35]',
                          'text-slate-800 dark:text-slate-100 text-left font-mono text-lg font-bold tracking-widest',
                          'outline-none transition-all duration-200',
                          'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:tracking-normal',
                          NEU.inputLight,
                          NEU.inputDark,
                          'focus:ring-2 focus:ring-primary-400/50 dark:focus:ring-primary-500/50',
                          'disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pr-1">
                      اگر دوستی شما را به ازکالا دعوت کرده، کد او را اینجا وارد کنید.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sendOtp.isPending}
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
                {sendOtp.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال ارسال…</span>
                  </>
                ) : (
                  <>
                    <span>ارسال کد ورود</span>
                    <ArrowLeft className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <OtpInput
                length={OTP_LENGTH}
                value={otp}
                onChange={setOtp}
                onComplete={(code) => verifyOtp.mutate(code)}
                disabled={verifyOtp.isPending}
                hasError={verifyOtp.isError}
              />

              <button
                type="button"
                onClick={() => verifyOtp.mutate(otp)}
                disabled={verifyOtp.isPending || otp.length !== OTP_LENGTH}
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
                {verifyOtp.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال بررسی…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ورود</span>
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-3 pt-1">
                {secondsLeft > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>ارسال دوباره تا</span>
                    <span
                      className={cn(
                        'font-mono font-bold text-slate-700 dark:text-slate-200 px-3 py-1 rounded-xl',
                        'bg-[#e8ebf2] dark:bg-[#262b35]',
                        NEU.inputLight,
                        NEU.inputDark
                      )}
                      dir="ltr"
                    >
                      {formatTime(secondsLeft)}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendOtp.mutate({ phone: phoneNumber })}
                    disabled={sendOtp.isPending}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
                      'text-xs font-bold text-primary-600 dark:text-primary-400',
                      'hover:text-primary-700 dark:hover:text-primary-300',
                      'bg-[#e8ebf2] dark:bg-[#262b35]',
                      NEU.iconLight,
                      NEU.iconDark,
                      'transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                      'disabled:opacity-60 disabled:cursor-not-allowed'
                    )}
                  >
                    <RefreshCw className={cn('w-4 h-4', sendOtp.isPending && 'animate-spin')} />
                    <span>{sendOtp.isPending ? 'در حال ارسال…' : 'ارسال دوباره‌ی کد'}</span>
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
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl',
                    'text-xs font-medium text-slate-500 dark:text-slate-400',
                    'hover:text-slate-700 dark:hover:text-slate-200',
                    'bg-[#e8ebf2] dark:bg-[#262b35]',
                    NEU.iconLight,
                    NEU.iconDark,
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  <Pencil className="w-4 h-4" />
                  <span>ویرایش شماره</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}