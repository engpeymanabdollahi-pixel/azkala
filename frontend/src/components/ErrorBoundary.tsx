import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ✅ Toast و لاگ فقط اینجا مجاز است (رفع کامل باگ Cannot update component)
    console.error(`[ErrorBoundary] Error in ${this.props.sectionName || 'section'}:`, error, errorInfo);
    toast.error(`متأسفانه مشکلی در بارگذاری بخش "${this.props.sectionName || 'صفحه'}" پیش آمد.`);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center m-4" dir="rtl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            خطای غیرمنتظره
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            متأسفانه در بارگذاری این بخش مشکلی پیش آمد.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload(); 
            }}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تلاش مجدد
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ جادوی اینجا اینجاست: هر دو نام را اکسپورت می‌کنیم تا هیچ فایل دیگری نیاز به تغییر نداشته باشد!
export const AppErrorBoundary = BaseErrorBoundary;
export const SectionErrorBoundary = BaseErrorBoundary;
export default BaseErrorBoundary;