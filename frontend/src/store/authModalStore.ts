import { create } from 'zustand';

/**
 * وضعیت باز/بسته‌ی مودال ورود.
 *
 * پیش از این این وضعیت یک useState داخل Header بود، پس هیچ کامپوننت دیگری
 * نمی‌توانست بازش کند. نتیجه این بود که صفحه‌ها به‌جای مودال، کاربر را به
 * صفحه‌ی /auth می‌فرستادند — یعنی از جایی که بود بیرونش می‌کردند و بعد از ورود
 * هم برنمی‌گشت سرِ کاری که داشت می‌کرد.
 *
 * این state کلاینتی است (باز بودن یک مودال)، نه داده‌ی سرور، پس جایش Zustand
 * است نه TanStack Query.
 */
interface AuthModalState {
  isOpen: boolean;

  /**
   * توضیح اینکه چرا ورود لازم شد — مثلاً «برای افزودن به علاقه‌مندی‌ها».
   * پیام مرتبط با کار کاربر خیلی بهتر از یک «لطفاً وارد شوید» خشک عمل می‌کند.
   */
  reason: string | null;

  /**
   * کاری که کاربر می‌خواست انجام دهد. بعد از ورود موفق اجرا می‌شود تا کاربر
   * مجبور نباشد دوباره همان دکمه را پیدا کند و بزند.
   */
  pendingAction: (() => void) | null;

  open: (options?: { reason?: string; onSuccess?: () => void }) => void;
  close: () => void;

  /** پس از ورود موفق صدا زده می‌شود: مودال را می‌بندد و کار معلق را اجرا می‌کند */
  resolve: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set, get) => ({
  isOpen: false,
  reason: null,
  pendingAction: null,

  open: (options) =>
    set({
      isOpen: true,
      reason: options?.reason ?? null,
      // در یک تابع می‌پیچیمش: اگر خودِ callback را مستقیم به set بدهیم، زوستند
      // آن را به‌عنوان updater تفسیر می‌کند و به‌جای ذخیره، صدایش می‌زند.
      pendingAction: options?.onSuccess ? () => options.onSuccess!() : null,
    }),

  close: () => set({ isOpen: false, reason: null, pendingAction: null }),

  resolve: () => {
    const action = get().pendingAction;
    set({ isOpen: false, reason: null, pendingAction: null });
    action?.();
  },
}));
