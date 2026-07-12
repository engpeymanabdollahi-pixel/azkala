import { useState, useEffect, useCallback } from 'react';
import type { UseDarkModeReturn } from '../types';

const DARK_MODE_KEY = 'darkMode';

export function useDarkMode(): UseDarkModeReturn {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem(DARK_MODE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return { isDarkMode, toggleDarkMode };
}