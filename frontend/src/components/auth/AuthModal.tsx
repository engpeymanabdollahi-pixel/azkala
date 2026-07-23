import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Smartphone, KeyRound, ArrowLeft, CheckCircle2, Loader2, X, RefreshCw } from 'lucide-react';

// ==================== Schema Definitions ====================
const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست (مثال: 09123456789)'),
});

const otpSchema = z.object({
  otp: z.string().length(5, 'کد تأیید باید دقیقاً ۵ رقم باشد'), // ✅ تغییر به ۵ رقم
});

type PhoneData = z.infer<typeof phoneSchema>;
type OtpData = z.infer<typeof otpSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // ✅ ثانیه‌شمار ۱۲۰ ثانیه
  const { login } = useAuthStore();

  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });

  // ✅ مدیریت ثانیه‌شمار
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ۱. ارسال شماره موبایل برای دریافت OTP
  const sendOtpMutation = useMutation({
    mutationFn: async (data: PhoneData) => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || 'خطا در ارسال کد تأیید');
      return responseData;
    },
    onSuccess: (data) => {
      setPhoneNumber(data.phone);
      setStep('otp');
      setTimeLeft(120); // ✅ ریست کردن تایمر
      otpForm.reset();
      toast.success('کد تأیید با موفقیت ارسال شد', { icon: '✅' }); // ✅ متن حرفه‌ای‌تر
    },
    onError: (error: any) => {
      toast.error(error.message || 'شماره موبایل نامعتبر است یا خطایی رخ داده است');
    },
  });

  // ۲. تأیید OTP و ورود
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpData) => {
      const res = await fetch('http://127.0.0.1:8000/api/v1/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp: data.otp }),
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || 'کد تأیید اشتباه است');
      return responseData;
    },
       onSuccess: (data) => {
      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user;
      
      if (token) {
        localStorage.setItem('token', token);
      }
      
      if (user) {
        // ✅ تغییر حیاتی: ارسال به صورت یک آبجکت واحد
        login({ user, token } as any); 
      }
      
      toast.success('ورود با موفقیت انجام شد', { icon: '🎉' });
      onClose();
      
      setTimeout(() => {
        setStep('phone');
        setPhoneNumber('');
        setTimeLeft(120);
        phoneForm.reset();
        otpForm.reset();
      }, 300);
    },
    onError: (error: any) => {
      toast.error(error.message || 'کد تأیید اشتباه یا منقضی شده است');
    },
  });

  const handleResend = () => {
    setTimeLeft(120);
    sendOtpMutation.mutate({ phone: phoneNumber });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            {step === 'phone' ? <Smartphone className="w-8 h-8 text-white" /> : <KeyRound className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-xl font-black text-white mb-1">
            {step === 'phone' ? 'ورود یا ثبت‌نام' : 'تأیید شماره موبایل'}
          </h2>
          <p className="text-primary-100 text-sm">
            {step === 'phone' 
              ? 'برای ادامه، شماره موبایل خود را وارد کنید' 
              : `کد ارسال شده به ${phoneNumber} را وارد کنید`}
          </p>
        </div>

        <div className="p-6" key={step}>
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit((data) => sendOtpMutation.mutate(data))} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">شماره موبایل</label>
                <div className="relative">
                  <input
                    {...phoneForm.register('phone')}
                    type="tel"
                    placeholder="09123456789"
                    className="w-full p-3.5 pr-12 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dir-ltr text-left font-mono text-lg"
                    maxLength={11}
                    disabled={sendOtpMutation.isPending}
                  />
                  <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <X className="w-3 h-3" /> {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sendOtpMutation.isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendOtpMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ارسال...</> : <>دریافت کد تأیید <ArrowLeft className="w-5 h-5" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit((data) => verifyOtpMutation.mutate(data))} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                  ✅ کد ۵ رقمی را وارد کنید
                </label>
                <div className="relative max-w-[260px] mx-auto"> {/* ✅ عرض کمی بیشتر برای جا شدن ۵ رقم */}
                  <input
                    {...otpForm.register('otp')}
                    type="text"
                    inputMode="numeric" // ✅ باز شدن کیبورد عددی در موبایل
                    pattern="[0-9]*"
                    placeholder="-----"
                    className="w-full p-4 border-2 border-primary-200 dark:border-primary-800 rounded-xl bg-primary-50/30 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-center text-2xl tracking-[0.5em] font-bold dir-ltr"
                    maxLength={5}
                    autoFocus
                    disabled={verifyOtpMutation.isPending}
                  />
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-red-500 text-xs mt-2 text-center flex items-center justify-center gap-1">
                    <X className="w-3 h-3" /> {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyOtpMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyOtpMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال بررسی...</> : <>تأیید و ورود <CheckCircle2 className="w-5 h-5" /></>}
              </button>

              {/* ✅ بخش ثانیه‌شمار و ارسال مجدد */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    امکان ارسال مجدد کد تا <span className="font-bold text-primary-600 font-mono">{formatTime(timeLeft)}</span> دیگر
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sendOtpMutation.isPending}
                    className="text-sm text-primary-600 hover:text-primary-700 font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {sendOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال مجدد کد تأیید'}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    otpForm.reset();
                  }}
                  disabled={verifyOtpMutation.isPending}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-4 transition-colors"
                >
                  ویرایش شماره موبایل
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};