import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_ORIGIN } from '@/lib/apiConfig';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'azkala-key',
  wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
  wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  disabledTransports: ['sockjs', 'xhr_streaming', 'eventsource', 'polling'],
  
  authorizer: (channel: any, options: any) => {
    return {
      authorize: (socketId: string, callback: (error: boolean, data?: any) => void) => {
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
            console.log('✅ Channel authorized:', channel.name);
            callback(false, data);
          })
          .catch(error => {
            console.error('❌ Channel authorization error:', error);
            callback(true);
          });
      },
    };
  },
});

console.log('🔌 Echo initialized');

export default echo;