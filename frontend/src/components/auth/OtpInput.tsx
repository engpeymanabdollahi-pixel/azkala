import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** وقتی همه‌ی ارقام پر شد — برای ارسال خودکار بدون نیاز به زدن دکمه */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * ورودی کد تأیید، به‌صورت خانه‌های جدا.
 *
 * نسخه‌ی قبلی یک input تکی با letter-spacing بود که فقط شبیه خانه‌های جدا
 * به نظر می‌رسید. سه چیزی که کاربر واقعاً انجام می‌دهد در آن کار نمی‌کرد:
 * چسباندن کد از پیامک، حرکت بین ارقام با کلید جهت‌دار، و backspace روی خانه‌ی
 * خالی برای برگشتن به قبلی.
 *
 * جهت عمداً LTR است: کد عددی از چپ به راست خوانده می‌شود حتی در رابط راست‌چین،
 * وگرنه رقم اول سمت راست می‌افتد و کاربر اشتباه وارد می‌کند.
 */
export function OtpInput({
  length = 5,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  // اولین خانه‌ی خالی، یعنی جایی که باید تایپ شود.
  const activeIndex = Math.min(value.length, length - 1);

  // بدون این، کاربر پنج کادر خالی می‌بیند و هیچ‌کدام فوکوس ندارد — معلوم نیست
  // از کجا باید شروع کند و باید حدس بزند کدام را کلیک کند.
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const focusAt = (index: number) => {
    inputs.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const setDigit = (index: number, digit: string) => {
    const next = value.padEnd(length, ' ').split('');
    next[index] = digit;

    const joined = next.join('').replace(/ /g, '');
    onChange(joined);

    return joined;
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);

    if (!digit) {
      return;
    }

    const joined = setDigit(index, digit);

    if (index < length - 1) {
      focusAt(index + 1);
    }

    if (joined.length === length) {
      onComplete?.(joined);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();

      // خانه‌ی خالی → برگرد به قبلی و آن را پاک کن. بدون این، کاربر روی خانه‌ی
      // خالی گیر می‌کند و باید دستی کلیک کند.
      if (!digits[index].trim() && index > 0) {
        setDigit(index - 1, ' ');
        focusAt(index - 1);

        return;
      }

      setDigit(index, ' ');

      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    if (!pasted) {
      return;
    }

    onChange(pasted);
    focusAt(pasted.length);

    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digits[index].trim()}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          aria-label={`رقم ${index + 1} از ${length}`}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-16 rounded-2xl text-center text-2xl font-bold caret-primary-500',
            'border-2 bg-gray-50 dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            'transition-all duration-200',
            'focus:outline-none',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            hasError && 'border-error-400 dark:border-error-600 bg-error-50/40 dark:bg-error-900/10',
            // خانه‌ی پرشده: مرز رنگی ملایم تا پیشرفت دیده شود
            !hasError && digits[index].trim() && 'border-primary-300 dark:border-primary-700 bg-white dark:bg-gray-800',
            !hasError && !digits[index].trim() && 'border-gray-200 dark:border-gray-700',
            // خانه‌ی فعال: بزرگ‌تر، با هاله — تا بدون حدس زدن معلوم باشد نوبت
            // کدام کادر است. صرفاً focus ring کافی نبود چون از دور دیده نمی‌شد.
            !hasError &&
              index === activeIndex &&
              'border-primary-500 dark:border-primary-400 ring-4 ring-primary-500/15 scale-105 bg-white dark:bg-gray-900'
          )}
        />
      ))}
    </div>
  );
}
