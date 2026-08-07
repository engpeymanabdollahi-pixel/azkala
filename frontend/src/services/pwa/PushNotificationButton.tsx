import { memo } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePushNotification } from '@/services/pwa/usePushNotification';

interface PushNotificationButtonProps {
  className?: string;
}

export const PushNotificationButton = memo(({ className }: PushNotificationButtonProps) => {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotification();

  if (!isSupported) return null;

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const getIcon = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (isSubscribed) return <Bell className="w-5 h-5 fill-current" />;
    if (permission === 'denied') return <BellOff className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (isLoading) return 'در حال پردازش...';
    if (isSubscribed) return 'نوتیفیکیشن فعال';
    if (permission === 'denied') return 'نوتیفیکیشن مسدود';
    return 'فعال‌سازی نوتیفیکیشن';
  };

  const getColor = () => {
    if (isSubscribed) return 'text-success-600 dark:text-success-400';
    if (permission === 'denied') return 'text-error-600 dark:text-error-400';
    return 'text-gray-700 dark:text-gray-300';
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
          'hover:bg-gray-100 dark:hover:bg-slate-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          getColor()
        )}
        aria-label={getLabel()}
        title={getLabel()}
      >
        {getIcon()}
        <span className="hidden lg:block text-sm font-semibold">
          {getLabel()}
        </span>
      </button>

      {/* دکمه تست (فقط وقتی subscribed است) */}
      {isSubscribed && (
        <button
          onClick={sendTestNotification}
          disabled={isLoading}
          className="absolute -top-2 -right-2 w-5 h-5 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-accent-600 transition-colors disabled:opacity-50"
          title="ارسال نوتیفیکیشن تست"
          aria-label="ارسال نوتیفیکیشن تست"
        >
          !
        </button>
      )}

      {/* نمایش خطا */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-xs text-error-600 dark:text-error-400 whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
});

PushNotificationButton.displayName = 'PushNotificationButton';