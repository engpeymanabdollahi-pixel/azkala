import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';

/**
 * محافظت از کارهایی که نیاز به ورود دارند.
 *
 * به‌جای اینکه کاربر را از صفحه بیرون بیندازیم و به /auth بفرستیم، مودال را
 * همان‌جا باز می‌کنیم و بعد از ورود موفق، خودِ همان کار را ادامه می‌دهیم.
 * کاربر جایی که بود می‌ماند و کاری که شروع کرده بود نیمه‌کاره نمی‌ماند.
 *
 * @example
 * const requireAuth = useRequireAuth();
 *
 * const handleFollow = () =>
 *   requireAuth(() => followMutation.mutate('follow'), 'برای دنبال کردن فروشگاه');
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openAuthModal = useAuthModalStore((state) => state.open);

  return useCallback(
    (action: () => void, reason?: string) => {
      if (isAuthenticated) {
        action();

        return;
      }

      openAuthModal({ reason, onSuccess: action });
    },
    [isAuthenticated, openAuthModal]
  );
}
