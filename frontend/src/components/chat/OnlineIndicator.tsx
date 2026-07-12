import { cn } from '@/utils/cn';

interface OnlineIndicatorProps {
  isOnline: boolean;
  lastSeen?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function OnlineIndicator({ 
  isOnline, 
  lastSeen, 
  size = 'sm',
  showText = false 
}: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div
          className={cn(
            'rounded-full',
            sizeClasses[size],
            isOnline
              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
              : 'bg-gray-400'
          )}
        />
        {isOnline && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75',
              sizeClasses[size]
            )}
          />
        )}
      </div>
      {showText && (
        <span className={cn(
          'text-xs',
          isOnline ? 'text-green-600 font-semibold' : 'text-gray-500'
        )}>
          {isOnline ? 'آنلاین' : lastSeen || 'آفلاین'}
        </span>
      )}
    </div>
  );
}