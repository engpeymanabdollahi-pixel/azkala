import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { digitsOnly } from '@/utils/digits';

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
 * ✅ شروع تایپ از خانه‌ی سمت چپ (LTR، استاندارد جهانی برای کدهای عددی).
 * با `direction: ltr` قطعی (حتی در والد RTL)، خانه‌ی index=0 در سمت چپ
 * قرار می‌گیرد و فوکوس اولیه روی همان است. با هر تایپ، به خانه‌ی بعدی
 * (index+1 = سمت راست) می‌رود.
 *
 * اعداد در مرکز هر خانه قرار می‌گیرند (textAlign: center قطعی).
 *
 * پشتیبانی کامل: چسباندن کد از پیامک (با ارقام فارسی/عربی)، حرکت با
 * کلیدهای جهت‌دار (منطبق بر LTR)، و backspace روی خانه‌ی خالی.
 *
 * استایل neumorphic با سایه‌ی مشکی ملایم (هماهنگ با AuthModal).
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

  // ✅ فوکوس قطعی روی اولین خانه (سمت چپ، چون direction: ltr)
  // setTimeout برای اطمینان از اجرای فوکوس بعد از mount و انیمیشن مودال
  useEffect(() => {
    const timer = setTimeout(() => inputs.current[0]?.focus(), 50);
    return () => clearTimeout(timer);
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
    // digitsOnly نه replace(/\D/g,''): ارقام فارسی و عربی اول به لاتین تبدیل
    // می‌شوند، وگرنه تایپ با کیبورد فارسی رشته را خالی می‌کرد.
    const digit = digitsOnly(raw).slice(-1);

    if (!digit) {
      return;
    }

    const joined = setDigit(index, digit);

    // ✅ در LTR، خانه‌ی بعدی سمت راست است (index + 1)
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

      // خانه‌ی خالی → برگرد به قبلی (در LTR یعنی سمت چپ = index - 1) و آن را پاک کن
      if (!digits[index].trim() && index > 0) {
        setDigit(index - 1, ' ');
        focusAt(index - 1);

        return;
      }

      setDigit(index, ' ');

      return;
    }

    // ✅ در LTR: فلش چپ → خانه‌ی قبلی (index - 1 = سمت چپ)
    //          فلش راست → خانه‌ی بعدی (index + 1 = سمت راست)
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

    // کد پیامک معمولاً با ارقام فارسی می‌آید، پس بدون تبدیل، چسباندن هم
    // چیزی وارد نمی‌کرد.
    const pasted = digitsOnly(event.clipboardData.getData('text')).slice(0, length);

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
    <div
      className="flex flex-row items-center justify-center gap-2 sm:gap-3"
      style={{ direction: 'ltr' }}
    >
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
          style={{ textAlign: 'center', direction: 'ltr' }}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-16 rounded-2xl text-2xl font-bold',
            'bg-[#e8ebf2] dark:bg-[#262b35]',
            'text-slate-800 dark:text-slate-100 caret-primary-500',
            // سایه neumorphic inset مشکی ملایم — هماهنگ با توکن‌های AuthModal
            'shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]',
            'dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.18),inset_-3px_-3px_6px_rgba(255,255,255,0.02)]',
            'outline-none transition-all duration-200',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            // حالت خطا
            hasError && 'ring-2 ring-red-400/50 text-red-500 dark:text-red-400',
            // خانه‌ی پرشده: رنگ متن کمی تیره‌تر
            !hasError && digits[index].trim() && index !== activeIndex && 'text-slate-700 dark:text-slate-200',
            // خانه‌ی فعال: هاله‌ی ملایم primary + کمی scale برای جلب توجه
            !hasError &&
              index === activeIndex &&
              'ring-2 ring-primary-400/50 text-primary-600 dark:text-primary-400 scale-105'
          )}
        />
      ))}
    </div>
  );
}