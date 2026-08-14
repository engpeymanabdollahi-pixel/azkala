import { useState, useEffect, useRef } from 'react';
import type { TimeLeft } from '../types';

/**
 * هوک شمارش معکوس
 * با استفاده از requestAnimationFrame برای بهینه‌سازی performance
 */
export function useCountdown(targetDate: Date): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ 
    hours: 0, 
    minutes: 0, 
    seconds: 0 
  });
  
  const rafRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const calculateTimeLeft = (timestamp: number) => {
      // به‌روزرسانی هر ۱ ثانیه
      if (timestamp - lastUpdateRef.current < 1000) {
        rafRef.current = requestAnimationFrame(calculateTimeLeft);
        return;
      }
      
      lastUpdateRef.current = timestamp;
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
        rafRef.current = requestAnimationFrame(calculateTimeLeft);
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    rafRef.current = requestAnimationFrame(calculateTimeLeft);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetDate.getTime()]);

  return timeLeft;
}