import { useState, useEffect, useRef } from 'react';
import { BACK_TO_TOP_THRESHOLD } from '../constants';

interface ScrollProgress {
  progress: number;
  showBackToTop: boolean;
}

/**
 * هوک ردیابی پیشرفت اسکرول
 * با استفاده از requestAnimationFrame برای بهینه‌سازی
 */
export function useScrollProgress(): ScrollProgress {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const rafRef = useRef<number>();
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        rafRef.current = requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollProgress = (window.scrollY / totalHeight) * 100;
          setProgress(Math.min(100, Math.max(0, scrollProgress)));
          setShowBackToTop(window.scrollY > BACK_TO_TOP_THRESHOLD);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // محاسبه اولیه
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { progress, showBackToTop };
}