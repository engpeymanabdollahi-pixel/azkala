import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * کامپوننت Error Boundary برای مدیریت خطا در هر بخش
 * اگر یک بخش خطا دهد، بقیه سایت کار می‌کند
 */
export class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Error in ${this.props.sectionName || 'section'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-error-900 dark:text-error-100 mb-2">
            خطایی رخ داد
          </h3>
          <p className="text-sm text-error-700 dark:text-error-300 mb-4">
            متأسفانه در بارگذاری این بخش مشکلی پیش آمد
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
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