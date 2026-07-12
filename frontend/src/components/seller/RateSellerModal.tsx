import { useState } from 'react';
import { X, Star, CheckCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { sellerRatingService } from '@/services/api/sellerRating.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface RateSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  sellerId: number;
  onSuccess?: () => void;
}

export function RateSellerModal({
  isOpen,
  onClose,
  orderId,
  sellerId,
  onSuccess,
}: RateSellerModalProps) {
  const [productQuality, setProductQuality] = useState(0);
  const [shippingSpeed, setShippingSpeed] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalRated = (productQuality > 0 ? 1 : 0) + (shippingSpeed > 0 ? 1 : 0) + (communication > 0 ? 1 : 0);
  const averageRating = totalRated > 0 
    ? ((productQuality + shippingSpeed + communication) / totalRated).toFixed(1) 
    : '0.0';

  const handleSubmit = async () => {
    if (totalRated < 3) {
      toast.error('لطفاً به همه موارد امتیاز دهید');
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerRatingService.rateSeller({
        seller_id: sellerId,
        order_id: orderId,
        product_quality: productQuality,
        shipping_speed: shippingSpeed,
        communication: communication,
        comment: comment || undefined,
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        toast.success('امتیاز شما با موفقیت ثبت شد', { icon: '⭐' });
        onSuccess?.();
        onClose();
        setShowSuccess(false);
        // Reset
        setProductQuality(0);
        setShippingSpeed(0);
        setCommunication(0);
        setComment('');
      }, 1200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطا در ثبت امتیاز');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // انیمیشن موفقیت
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center animate-bounce-in">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-success-500 rounded-full blur-2xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">ممنون از نظر شما!</h3>
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-gray-600 text-sm">امتیاز شما با موفقیت ثبت شد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header فشرده */}
        <div className="bg-gradient-to-r from-primary-600 via-accent-600 to-warning-500 p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg leading-tight">امتیاز به فروشنده</h2>
                <p className="text-xs text-white/80 mt-0.5">تجربه خرید خود را به اشتراک بگذارید</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content فشرده */}
        <div className="p-5 space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-warning-500 transition-all duration-500"
                style={{ width: `${(totalRated / 3) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">
              {totalRated} از 3
            </span>
          </div>

          {/* Average Rating Display */}
          {totalRated > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-3 flex items-center justify-center gap-3">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
              <div>
                <p className="text-3xl font-black text-gray-900 leading-none">{averageRating}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">میانگین امتیاز شما</p>
              </div>
            </div>
          )}

          {/* Rating Inputs - Grid فشرده */}
          <div className="space-y-3">
            <StarRating
              label="کیفیت محصول"
              value={productQuality}
              onChange={setProductQuality}
            />
            <StarRating
              label="سرعت ارسال"
              value={shippingSpeed}
              onChange={setShippingSpeed}
            />
            <StarRating
              label="پاسخگویی"
              value={communication}
              onChange={setCommunication}
            />
          </div>

          {/* Comment */}
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="نظر شما (اختیاری)..."
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 resize-none text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="flex-1"
              disabled={totalRated < 3}
            >
              {isSubmitting ? 'در حال ارسال...' : 'ثبت امتیاز'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Star Rating Component ====================

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 hover:bg-yellow-50/50 transition-colors">
      <span className="text-xs font-bold text-gray-700 w-24 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5 flex-1 justify-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= (hoverValue || value);
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(0)}
              className="transition-all hover:scale-125 active:scale-90"
            >
              <Star
                className={cn(
                  'w-7 h-7 transition-all',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-500 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                    : 'text-gray-300 hover:text-yellow-200'
                )}
                strokeWidth={isFilled ? 0 : 2}
              />
            </button>
          );
        })}
      </div>
      {value > 0 && (
        <span className="text-xs font-black text-yellow-600 w-6 text-center">
          {value}
        </span>
      )}
    </div>
  );
}