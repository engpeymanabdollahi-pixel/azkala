/**
 * PWA Service Worker Registration
 * ثبت و مدیریت Service Worker برای قابلیت‌های PWA
 */

const SW_URL = '/sw.js';
const SW_SCOPE = '/';

/**
 * ثبت Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // بررسی پشتیبانی مرورگر
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker در این مرورگر پشتیبانی نمی‌شود');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: SW_SCOPE
    });

    console.log('[PWA] ✅ Service Worker ثبت شد:', registration.scope);

    // بررسی به‌روزرسانی
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA] 🔄 نسخه جدید در دسترس است');
          
          // نمایش پیام به کاربر
          if (confirm('نسخه جدید ازکالا در دسترس است. آیا می‌خواهید صفحه را بروزرسانی کنید؟')) {
            window.location.reload();
          }
        }
      });
    });

    // گوش دادن به پیام‌های SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SKIP_WAITING') {
        registration.update();
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] ❌ خطا در ثبت Service Worker:', error);
    return null;
  }
}

/**
 * درخواست مجوز نوتیفیکیشن
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] نوتیفیکیشن در این مرورگر پشتیبانی نمی‌شود');
    return 'denied';
  }

  // اگر قبلاً مجوز داده شده
  if (Notification.permission === 'granted') {
    console.log('[PWA] ✅ مجوز نوتیفیکیشن قبلاً داده شده');
    return 'granted';
  }

  // اگر قبلاً رد شده
  if (Notification.permission === 'denied') {
    console.warn('[PWA] ❌ مجوز نوتیفیکیشن رد شده');
    return 'denied';
  }

  // درخواست مجوز
  try {
    const permission = await Notification.requestPermission();
    console.log('[PWA] مجوز نوتیفیکیشن:', permission);
    return permission;
  } catch (error) {
    console.error('[PWA] خطا در درخواست مجوز:', error);
    return 'denied';
  }
}

/**
 * ارسال نوتیفیکیشن محلی (برای تست)
 */
export function showLocalNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (Notification.permission !== 'granted') {
    console.warn('[PWA] مجوز نوتیفیکیشن داده نشده');
    return;
  }

  // ✅ vibrate یک فیلد واقعی و پشتیبانی‌شده (روی Chrome/Android) از
  // NotificationOptions است که در تایپ‌های lib.dom.d.ts TypeScript
  // (هنوز) وجود ندارد؛ برای همین این نوع محلی آن را اضافه می‌کند.
  type NotificationOptionsWithVibrate = NotificationOptions & { vibrate?: number[] };

  const defaultOptions: NotificationOptionsWithVibrate = {
    body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    lang: 'fa',
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // کلیک روی نوتیفیکیشن
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    console.log('[PWA] 🔔 نوتیفیکیشن نمایش داده شد:', title);
  } catch (error) {
    console.error('[PWA] خطا در نمایش نوتیفیکیشن:', error);
  }
}

/**
 * بررسی وضعیت Service Worker
 */
export async function getServiceWorkerStatus(): Promise<{
  isRegistered: boolean;
  isActive: boolean;
  isOnline: boolean;
}> {
  const isRegistered = 'serviceWorker' in navigator;
  let isActive = false;

  if (isRegistered) {
    const registration = await navigator.serviceWorker.getRegistration();
    isActive = !!registration?.active;
  }

  return {
    isRegistered,
    isActive,
    isOnline: navigator.onLine
  };
}
// ==================== Install Prompt ====================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  // ✅ طبق مشخصات مرورگر، userChoice همیشه روی این رویداد وجود دارد
  // (اختیاری نیست) — علامت `?` قبلی باعث می‌شد TS تایپ را
  // `{outcome:string} | undefined` ببیند و destructure کردن مستقیم
  // `{ outcome }` را رد کند.
  userChoice: Promise<{ outcome: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * گوش دادن به رویداد beforeinstallprompt
 */
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    const event = e as BeforeInstallPromptEvent;
    // جلوگیری از نمایش خودکار prompt
    event.preventDefault();
    
    // ذخیره رویداد برای استفاده بعدی
    deferredPrompt = event;
    
    console.log('[PWA] ✅ Install Prompt آماده است');
    
    // نمایش دکمه نصب به کاربر (اختیاری)
    showInstallButton();
  });

  // گوش دادن به نصب موفق
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] ✅ PWA با موفقیت نصب شد');
    deferredPrompt = null;
    hideInstallButton();
  });
}

/**
 * نمایش دکمه نصب
 */
function showInstallButton(): void {
  // ایجاد دکمه نصب در گوشه صفحه
  const installBtn = document.createElement('button');
  installBtn.id = 'pwa-install-btn';
  installBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>نصب اپلیکیشن</span>
  `;
  
  // استایل‌دهی
  Object.assign(installBtn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #14b8a6 0%, #f97316 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(20, 184, 166, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: '9999',
    transition: 'all 0.3s ease',
    direction: 'rtl',
    fontFamily: 'Vazirmatn, Arial, sans-serif'
  });
  
  // Hover effect
  installBtn.addEventListener('mouseenter', () => {
    installBtn.style.transform = 'translateY(-2px)';
    installBtn.style.boxShadow = '0 15px 30px rgba(20, 184, 166, 0.4)';
  });
  
  installBtn.addEventListener('mouseleave', () => {
    installBtn.style.transform = 'translateY(0)';
    installBtn.style.boxShadow = '0 10px 25px rgba(20, 184, 166, 0.3)';
  });
  
  // کلیک برای نصب
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] ✅ کاربر نصب را پذیرفت');
      } else {
        console.log('[PWA] ❌ کاربر نصب را رد کرد');
      }
      
      deferredPrompt = null;
    }
  });
  
  document.body.appendChild(installBtn);
}

/**
 * مخفی کردن دکمه نصب
 */
function hideInstallButton(): void {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) {
    btn.style.opacity = '0';
    setTimeout(() => btn.remove(), 300);
  }
}

/**
 * نصب دستی PWA (از طریق JavaScript)
 */
export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install Prompt در دسترس نیست');
    return false;
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    deferredPrompt = null;
    return true;
  }
  
  return false;
}