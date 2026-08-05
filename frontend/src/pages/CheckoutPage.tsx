import { useNavigate } from 'react-router-dom';
import { CheckoutForm } from '@/components/CheckoutForm';
import type { CreateOrderResult } from '@/services/api/order.service';

export function CheckoutPage() {
  const navigate = useNavigate();

  // ✅ تغییر: دریافت کل آبجکت داده از فرم و ارسال آن از طریق state
  const handleSuccess = (orderData: CreateOrderResult) => {
    navigate('/order-success', { state: orderData });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-black text-center text-gray-900 dark:text-gray-100 mb-8">
          تسویه حساب
        </h1>

        <CheckoutForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
export default CheckoutPage;
