import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary'; // ✅ اضافه شد
import App from './App';
import './index.css';

import { registerServiceWorker, setupInstallPrompt } from '@/services/pwa/registerSW';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// ✅ کامپوننت ساده برای نمایش خطا
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">مشکلی پیش آمد</h2>
        <p className="text-gray-600 mb-6">متأسفانه خطای غیرمنتظره‌ای رخ داد. لطفاً صفحه را دوباره بارگذاری کنید.</p>
        <details className="text-right text-xs text-gray-500 mb-6 bg-gray-100 p-3 rounded-lg">
          <summary className="cursor-pointer font-semibold mb-2">جزئیات فنی خطا</summary>
          <pre className="whitespace-pre-wrap">{error.message}</pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors w-full"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* ✅ احاطه کردن کل برنامه با ErrorBoundary */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <HelmetProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);

registerServiceWorker();
setupInstallPrompt();