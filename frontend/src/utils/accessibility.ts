/**
 * Utility functions for Accessibility (WCAG 2.1 AA)
 */

/**
 * بررسی کنتراست رنگ بر اساس WCAG AA
 * @param color1 رنگ اول (hex)
 * @param color2 رنگ دوم (hex)
 * @returns نسبت کنتراست
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * افزودن Skip Link برای دسترسی سریع
 */
export function addSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg';
  skipLink.textContent = 'پرش به محتوای اصلی';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * بررسی Keyboard Navigation
 */
export function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Focus trapping در مودال‌ها
    if (e.key === 'Tab') {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    // بستن مودال با Escape
    if (e.key === 'Escape') {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        (modal as HTMLElement).querySelector('[data-close]')?.dispatchEvent(new Event('click'));
      }
    }
  });
}

/**
 * افزودن aria-label به دکمه‌های آیکونی
 */
export function addAriaLabelsToIconButtons() {
  const iconButtons = document.querySelectorAll('button:not([aria-label]), a:not([aria-label])');
  iconButtons.forEach(btn => {
    const svg = btn.querySelector('svg');
    if (svg && !btn.textContent.trim()) {
      const ariaLabel = btn.getAttribute('title') || 'دکمه';
      btn.setAttribute('aria-label', ariaLabel);
    }
  });
}

/**
 * Initialize accessibility features
 */
export function initAccessibility() {
  addSkipLink();
  setupKeyboardNavigation();
  addAriaLabelsToIconButtons();
}
