/**
 * کامپوننت EmptyState - حالت خالی پیشرفته
 * ویژگی‌ها:
 * - Illustration مرتبط
 * - پیام راهنما
 * - دکمه تماس با پشتیبانی
 */

import { Package, Search, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: 'search' | 'package' | 'filter';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showSupportButton?: boolean;
  className?: string;
}

export function EmptyState({
  icon = 'package',
  title,
  description,
  actionLabel,
  onAction,
  showSupportButton = false,
  className
}: EmptyStateProps) {
  const icons = {
    search: <Search className="w-12 h-12" />,
    package: <Package className="w-12 h-12" />,
    filter: <Search className="w-12 h-12" />
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4",
      "bg-gradient-to-br from-white to-gray-50",
      "rounded-2xl border border-gray-100 shadow-sm",
      "text-center",
      className
    )}>
      {/* آیکون اصلی */}
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center mb-6",
        "bg-gradient-to-br from-primary-100 to-accent-100",
        "shadow-lg shadow-primary-500/20"
      )}>
        <div className="text-primary-600">
          {icons[icon]}
        </div>
      </div>

      {/* عنوان */}
      <h3 className="text-xl font-black text-gray-900 mb-2">
        {title}
      </h3>

      {/* توضیحات */}
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* دکمه‌های اکشن */}
      <div className="flex gap-3 flex-wrap justify-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="primary">
            {actionLabel}
          </Button>
        )}
        
        {showSupportButton && (
          <Button 
            variant="outline" 
            leftIcon={<Mail className="w-4 h-4" />}
            onClick={() => window.location.href = 'mailto:support@azkala.com'}
          >
            تماس با پشتیبانی
          </Button>
        )}
      </div>
    </div>
  );
}
