import { memo } from 'react';
import type { TimeLeft } from '../types';

interface CountdownTimerProps {
  timeLeft: TimeLeft;
}

/**
 * کامپوننت شمارش معکوس
 * نمایش ساعت، دقیقه و ثانیه با انیمیشن
 */
export const CountdownTimer = memo(({ timeLeft }: CountdownTimerProps) => {
  const formatTime = (num: number) => String(num).padStart(2, '0');
  
  const timeUnits = [
    { value: timeLeft.hours, label: 'ساعت' },
    { value: timeLeft.minutes, label: 'دقیقه' },
    { value: timeLeft.seconds, label: 'ثانیه' },
  ];

  return (
    <div 
      className="flex items-center gap-2" 
      role="timer" 
      aria-live="polite" 
      aria-label="شمارش معکوس تخفیف"
    >
      {timeUnits.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/30 rounded-xl blur-md group-hover:blur-lg transition-all" />
            <div className="relative bg-white text-error-700 rounded-xl px-4 py-3 min-w-[70px] text-center shadow-xl border-2 border-white/50">
              <div className="text-3xl font-black font-mono tabular-nums">
                {formatTime(item.value)}
              </div>
              <div className="text-[10px] text-error-600 font-bold uppercase tracking-wider">
                {item.label}
              </div>
            </div>
          </div>
          {idx < timeUnits.length - 1 && (
            <span className="text-3xl font-black text-white drop-shadow-lg">:</span>
          )}
        </div>
      ))}
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';
export default CountdownTimer;
