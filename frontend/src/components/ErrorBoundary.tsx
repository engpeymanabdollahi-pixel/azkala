import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { toast } from 'react-hot-toast';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // نمایش پیام خطا به کاربر
  toast.error('متأسفانه مشکلی در بارگذاری این بخش پیش آمد.');

  return (
    <div role="alert" className="p-6 text-center text-red-700 bg-red-50 rounded-xl m-4 border border-red-200" dir="rtl">
      <h2 className="text-xl font-bold mb-3">خطای غیرمنتظره</h2>
      <p className="text-sm mb-4 text-gray-600">لطفاً صفحه را دوباره بارگذاری کنید یا با پشتیبانی تماس بگیرید.</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
      >
        تلاش مجدد
      </button>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}