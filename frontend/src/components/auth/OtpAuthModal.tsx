import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api/client';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { X, Smartphone, KeyRound, Loader2 } from 'lucide-react';

interface OtpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OtpAuthModal: React.FC<OtpAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const { setUser } = useAuthStore();

  const sendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const res = await apiClient.post('/verify-otp', { phone: phoneNumber });
      return res.data;
    },
    onSuccess: (data) => {
      setDebugOtp(data.debug_otp || '');
      toast.success('کد تایید ارسال شد');
      setStep(2);
    },
    onError: () => toast.error('شماره موبایل نامعتبر است.')
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/verify-otp', { phone, otp });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        setUser(data.user, data.token);
        toast.success('خوش آمدید!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'کد وارد شده اشتباه است.');
      }
    },
    onError: () => toast.error('کد وارد شده اشتباه یا منقضی است.')
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 1 ? <Smartphone className="w-8 h-8 text-primary-600" /> : <KeyRound className="w-8 h-8 text-primary-600" />}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {step === 1 ? 'ورود / ثبت‌نام' : 'تایید شماره موبایل'}
          </h2>
          <p className="text-gray-500 text-sm">
            {step === 1 
              ? 'برای ادامه، شماره موبایل خود را وارد کنید.' 
              : `کد ۵ رقمی ارسال شده به ${phone} را وارد کنید.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); sendOtpMutation.mutate(phone); }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">شماره موبایل</label>
              <input
                type="tel"
                placeholder="مثال: 09123456789"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left dir-ltr font-mono text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                required
              />
            </div>
            <button
              type="submit"
              disabled={sendOtpMutation.isPending || phone.length !== 11}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {sendOtpMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'دریافت کد تایید'}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verifyOtpMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">کد تایید</label>
              <input
                type="text"
                placeholder="-----"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                required
                autoFocus
              />
            </div>
            
            {debugOtp && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs p-3 rounded-lg text-center">
                <span className="font-bold">حالت توسعه:</span> کد شما {debugOtp} است
              </div>
            )}

            <button
              type="submit"
              disabled={verifyOtpMutation.isPending || otp.length !== 5}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {verifyOtpMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تایید و ورود'}
            </button>
            
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); }}
              className="w-full text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors"
            >
              تغییر شماره موبایل
            </button>
          </form>
        )}
      </div>
    </div>
  );
};