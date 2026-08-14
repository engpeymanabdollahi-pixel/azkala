import { memo, useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
}

/**
 * کامپوننت شمارنده متحرک
 * انیمیشن شمارش از ۰ تا مقدار نهایی
 */
export const AnimatedCounter = memo(({ 
  value, 
  suffix = '', 
  duration = 2000 
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quart برای انیمیشن نرم
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(value * easeOutQuart);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span suppressHydrationWarning>
      {displayValue.toLocaleString('fa-IR')}{suffix}
    </span>
  );
});

AnimatedCounter.displayName = 'AnimatedCounter';
export default AnimatedCounter;
