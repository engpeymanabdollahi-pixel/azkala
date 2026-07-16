import { useNavigate } from 'react-router-dom';
import { CheckoutForm } from '@/components/CheckoutForm';

export function CheckoutPage() {
  const navigate = useNavigate();

  // ✅ تغییر: دریافت کل آبجکت داده از فرم و ارسال آن از طریق state
  const handleSuccess = (orderData: any) => {
    navigate('/order-success', { state: orderData });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          تسویه حساب
        </h1>
        
        <CheckoutForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}