import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_ORIGIN } from '@/lib/apiConfig';
import { logger } from '@/utils/logger';

// ✅ laravel-echo با broadcaster: 'reverb' انتظار دارد Pusher روی window
// در دسترس باشد (الگوی رسمی مستندات laravel-echo/reverb) — Window استاندارد
// چنین فیلدی ندارد، برای همین این اعلان لازم است.
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

// ✅ متغیرهای محیطی Vite همیشه string|undefined هستند؛ pusher-js واقعاً
// wsPort/wssPort را number می‌خواهد. قبلاً رشته‌ی خام env مستقیم پاس
// داده می‌شد که با تایپ واقعی جور نبود.
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT) || 8080;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'azkala-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
  wsPort: reverbPort,
  wssPort: reverbPort,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  // ✅ 'eventsource' و 'polling' اصلاً در enum واقعی Transport پوشر
  // (ws|wss|xhr_streaming|xhr_polling|sockjs) وجود ندارند — یعنی این دو
  // نام، هیچ transport واقعی‌ای را غیرفعال نمی‌کردند. نام درست fallback
  // مبتنی‌بر polling، xhr_polling است.
  disabledTransports: ['sockjs', 'xhr_streaming', 'xhr_polling'],

  authorizer: (channel: any, options: any) => {
    return {
      authorize: (socketId: string, callback: (error: Error | null, data: any) => void) => {
        // نشست روی کوکی httpOnly است، پس credentials: 'include' جای هدر
        // Authorization را می‌گیرد. نسخه‌ی قبلی localStorage.getItem('token')
        // را می‌خواند — کلیدی که عملاً هیچ‌وقت نوشته نمی‌شد — و همیشه پیش از
        // ارسال درخواست با «Auth token not found» شکست می‌خورد. یعنی کانال‌های
        // خصوصی و کل چت لحظه‌ای هرگز وصل نمی‌شدند.
        fetch(`${API_ORIGIN}/api/broadcasting/auth`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Auth failed: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            logger.debug(`Channel authorized: ${channel.name}`);
            callback(null, data);
          })
          .catch(error => {
            logger.error('Channel authorization error:', error as Error);
            // ✅ قبلاً callback(true) بود — pusher-js واقعاً error.message را
            // برای رویداد pusher:subscription_error می‌خواند؛ چون true یک
            // boolean است نه Error، آن پیام همیشه undefined می‌شد و دلیل
            // واقعی شکست هرگز به رویداد subscription_error نمی‌رسید.
            callback(error instanceof Error ? error : new Error('Channel authorization failed'), null);
          });
      },
    };
  },
});

logger.debug('Echo initialized');

export default echo;