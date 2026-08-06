/// <reference types="vite/client" />

/**
 * تعریف types برای environment variables
 */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUSHER_KEY: string;
  readonly VITE_PUSHER_CLUSTER: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * تعریف Pusher در window object
 */
interface Window {
  Pusher?: any;
}

/**
 * تعریف NotificationOptions برای Vibration API
 */
interface NotificationOptions {
  badge?: string;
  body?: string;
  data?: any;
  dir?: 'auto' | 'ltr' | 'rtl';
  icon?: string;
  image?: string;
  lang?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  vibrate?: number[];
  actions?: NotificationAction[];
}
