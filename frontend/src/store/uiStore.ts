import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UIStore } from '@/types/store';

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isSearchOpen: false,
      theme: 'light',

      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      toggleSearch: () =>
        set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      closeSearch: () => set({ isSearchOpen: false }),
      setTheme: (theme) => {
        set({ theme });
        // 'system' ذخیره می‌شود ولی برای اعمال باید به تیره/روشن ترجمه شود،
        // وگرنه کلاس dark هیچ‌وقت ست نمی‌شود و انتخاب کاربر بی‌اثر می‌ماند.
        const isDark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        document.documentElement.classList.toggle('dark', isDark);
      },
    }),
    {
      name: 'azkala-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
