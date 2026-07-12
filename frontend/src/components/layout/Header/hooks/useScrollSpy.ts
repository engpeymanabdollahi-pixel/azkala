import { useState, useEffect, useRef } from 'react';
import type { UseScrollSpyReturn } from '../types';
import { SCROLL_THRESHOLD } from '../constants';

export function useScrollSpy(): UseScrollSpyReturn {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > SCROLL_THRESHOLD);
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { isScrolled, scrollDirection };
}