import { Moon, Sun, Monitor, type LucideIcon } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'full' }) {
  const { theme, setTheme } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: Theme; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: 'روشن' },
    { value: 'dark', icon: Moon, label: 'تاریک' },
    { value: 'system', icon: Monitor, label: 'سیستم' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  // حالت سیستم: تشخیص خودکار
  const applySystemTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  };

  const handleThemeChange = (newTheme: Theme) => {
    if (newTheme === 'system') {
      applySystemTheme();
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
    setTheme(newTheme);
    setIsOpen(false);
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-xl transition-all duration-300',
            'bg-gray-100 dark:bg-gray-800',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-700 dark:text-gray-200',
            'hover:scale-110 active:scale-95'
          )}
          aria-label="تغییر تم"
        >
          <CurrentIcon className="w-5 h-5" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown */}
            <div className={cn(
              'absolute top-full mt-2 right-0 z-50',
              'bg-white dark:bg-gray-800 rounded-xl shadow-xl',
              'border border-gray-200 dark:border-gray-700',
              'py-1 min-w-[140px]',
              'animate-in fade-in slide-in-from-top-2 duration-200'
            )}>
              {themes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm',
                    'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                    theme === value && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {theme === value && (
                    <span className="mr-auto text-primary-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // حالت full برای تنظیمات
  return (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => handleThemeChange(value)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            theme === value
              ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}