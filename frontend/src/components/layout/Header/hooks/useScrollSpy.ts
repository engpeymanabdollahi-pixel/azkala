import { useState, useEffect, useRef } from 'react';
import type { UseScrollSpyReturn } from '../types';
import { SCROLL_THRESHOLD, SCROLL_THRESHOLD_HYSTERESIS } from '../constants';

// ✅ کمترین جابه‌جایی پیکسلی که برای تغییر «جهت اسکرول» لازم است. بدون این،
// نوسان چند پیکسلی هر رویداد scroll (به‌خصوص با تاچ‌پد/momentum scrolling)
// می‌تواند jهت را در هر فریم برعکس کند و چشمک زدن هدر را بدتر کند.
const MIN_DELTA_FOR_DIRECTION = 5;

export function useScrollSpy(): UseScrollSpyReturn {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // ✅ Hysteresis: قبلاً یک آستانه‌ی تکی (currentScrollY > SCROLL_THRESHOLD)
      // بود — وقتی موقعیت اسکرول درست دور و بر همان نقطه نوسان می‌کرد (خیلی
      // رایج با اسکرول لمسی/تاچ‌پد)، isScrolled در هر رویداد scroll برعکس
      // می‌شد و هدر پشت‌سرهم جمع/باز می‌شد. حالا یک نوار مرزی وجود دارد که
      // در آن وضعیت قبلی حفظ می‌شود.
      setIsScrolled((prevIsScrolled) => {
        if (currentScrollY > SCROLL_THRESHOLD) return true;
        if (currentScrollY < SCROLL_THRESHOLD - SCROLL_THRESHOLD_HYSTERESIS) return false;
        return prevIsScrolled;
      });

      const delta = currentScrollY - lastScrollY.current;
      if (Math.abs(delta) >= MIN_DELTA_FOR_DIRECTION) {
        setScrollDirection(delta > 0 ? 'down' : 'up');
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { isScrolled, scrollDirection };
}