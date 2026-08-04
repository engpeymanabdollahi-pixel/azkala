import { cn } from '@/utils/cn';
import type { HTMLAttributes, ReactNode } from 'react';

/**
 * کارت پایه‌ی آزکالا.
 *
 * پیش از این هیچ کامپوننت کارت مشترکی وجود نداشت و ۹۴ فایل مستقیم bg-white
 * می‌نوشتند، یعنی هیچ جایی نبود که ظاهر کارت‌ها را یک‌جا تغییر داد. این
 * کامپوننت همان نقطه است.
 *
 * ته‌رنگ عمداً بسیار کم‌رنگ است (۴۰ تا ۶۰ درصد از primary-50 که خودش تقریباً
 * سفید است). هدف این است که کارت روی پس‌زمینه «زنده» به نظر برسد بدون اینکه با
 * محتوا — عکس محصول، قیمت، بج تخفیف — رقابت کند. رنگِ پررنگ در کارت باعث
 * می‌شود چشم به‌جای محصول به پس‌زمینه برود.
 */

type CardVariant = 'tinted' | 'plain' | 'elevated' | 'accent' | 'success';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** افکت‌های hover و focus را فعال می‌کند؛ فقط برای کارت‌های قابل کلیک */
  interactive?: boolean;
  /** تأخیر ورود پلکانی بر حسب میلی‌ثانیه — برای آیتم‌های یک لیست */
  entranceDelay?: number;
  children: ReactNode;
}

const variants: Record<CardVariant, string> = {
  // پیش‌فرض: سفید با یک نفس فیروزه‌ای در گوشه‌ی پایین
  tinted:
    'bg-gradient-to-br from-white via-white to-primary-50/60 ' +
    'dark:from-gray-800 dark:via-gray-800 dark:to-primary-900/20 ' +
    'border-gray-200/80 dark:border-gray-700',

  // بدون ته‌رنگ — برای جایی که کارت داخل کارت دیگری می‌نشیند
  plain: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',

  // سایه‌دار و بدون خط دور — برای کارت‌های شاخص
  elevated:
    'bg-white dark:bg-gray-800 border-transparent ' +
    'shadow-lg shadow-gray-200/60 dark:shadow-black/30',

  // نارنجی ملایم — پیشنهاد ویژه، تخفیف، فوریت
  accent:
    'bg-gradient-to-br from-white via-white to-accent-50/70 ' +
    'dark:from-gray-800 dark:via-gray-800 dark:to-accent-900/20 ' +
    'border-accent-200/60 dark:border-accent-900/40',

  // سبز ملایم — تأیید، سازگاری، وضعیت موفق
  success:
    'bg-gradient-to-br from-white via-white to-success-50/70 ' +
    'dark:from-gray-800 dark:via-gray-800 dark:to-success-900/20 ' +
    'border-success-200/60 dark:border-success-900/40',
};

const interactiveStyles = [
  'cursor-pointer',
  'hover:-translate-y-0.5 hover:shadow-xl',
  'hover:shadow-primary-500/10 dark:hover:shadow-black/40',
  'hover:border-primary-300 dark:hover:border-primary-600',
  'active:translate-y-0 active:shadow-md',
  // focus-visible نه focus: خط دور فقط برای کاربر کیبورد ظاهر شود، نه با کلیک ماوس
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
].join(' ');

export function Card({
  variant = 'tinted',
  interactive = false,
  entranceDelay,
  className,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden',
        'transition-all duration-300 ease-out',
        'animate-in fade-in slide-in-from-bottom-2',
        variants[variant],
        interactive && interactiveStyles,
        className
      )}
      // تأخیر به‌صورت style اعمال می‌شود، نه کلاس: Tailwind کلاس‌ها را با اسکن
      // متنِ سورس می‌سازد، پس رشته‌ای که در زمان اجرا ساخته شود هرگز خروجی
      // نمی‌گیرد و انیمیشن پلکانی بی‌اثر می‌ماند.
      style={entranceDelay ? { animationDelay: `${entranceDelay}ms`, ...style } : style}
      {...props}
    >
      {children}
    </div>
  );
}
