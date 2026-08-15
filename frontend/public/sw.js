// Service Worker for Azkala PWA
const CACHE_NAME = 'azkala-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png'
];

// ==================== Helper Functions ====================

/**
 * بررسی اینکه آیا request مربوط به development است
 */
function isDevelopmentRequest(url) {
  const urlObj = new URL(url);
  
  // Vite HMR و WebSocket
  if (urlObj.searchParams.has('token')) return true;
  if (urlObj.pathname.includes('@vite') || urlObj.pathname.includes('@react-refresh')) return true;
  if (urlObj.pathname.includes('/node_modules/')) return true;
  if (urlObj.pathname.endsWith('.ts') || urlObj.pathname.endsWith('.tsx')) return true;
  if (urlObj.pathname.includes('?t=')) return true; // Cache busting
  
  // WebSocket connections
  if (urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:') return true;
  
  return false;
}

/**
 * بررسی اینکه آیا request مربوط به API است
 */
function isApiRequest(url) {
  return url.includes('/api/') || url.includes('localhost:8000');
}

// ==================== Install Event ====================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ==================== Activate Event ====================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ==================== Fetch Event ====================

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;
  
  // ❌ نادیده گرفتن درخواست‌های development
  if (isDevelopmentRequest(url)) {
    return; // اجازه بده به شبکه برود
  }
  
  // ❌ نادیده گرفتن non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // ❌ نادیده گرفتن API requests (همیشه به شبکه بروند)
  if (isApiRequest(url)) {
    return;
  }
  
  // ❌ نادیده گرفتن Chrome Extension
  if (url.startsWith('chrome-extension://')) {
    return;
  }
  
  // ✅ Cache Strategy: Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // بررسی response معتبر
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // ❌ نادیده گرفتن پاسخ‌هایی که خودِ سرور صریحاً گفته cache نشوند
        // (private/no-store/no-cache) — دفاع دوم، مستقل از فیلتر URL بالا؛
        // اگر در آینده یک مسیر غیر-/api/ برای محتوای خصوصی/کاربر-محور
        // اضافه شود (مثلاً دانلود فاکتور)، همین‌جا هم متوقف می‌شود، بدون
        // اینکه لازم باشد allowlist/blocklist مسیرها را پیچیده‌تر کنیم.
        const cacheControl = response.headers.get('Cache-Control') || '';
        if (/no-store|no-cache|private/i.test(cacheControl)) {
          return response;
        }

        // Clone و cache کردن
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Fallback به cache در حالت offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', url);
            return cachedResponse;
          }
          
          // اگر صفحه بود، index.html را برگردان
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ==================== Push Notification ====================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {
    title: 'ازکالا',
    body: 'پیام جدید',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'default',
    url: '/',
  };
  
  if (event.data) {
    try {
      const jsonData = event.data.json();
      data = { ...data, ...jsonData };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: { url: data.url },
    vibrate: [200, 100, 200],
    dir: 'rtl',
    lang: 'fa',
    actions: [
      { action: 'open', title: 'مشاهده' },
      { action: 'close', title: 'بستن' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ==================== Notification Click ====================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ==================== Message Handler ====================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});